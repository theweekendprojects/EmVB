#!/usr/bin/env python3

"""
Create or restore a text-based project bundle while respecting .gitignore.

Requirements:
    - Python 3.9+
    - Git installed
    - Run from inside a Git repository

Pack:
    python project_bundle.py pack

Restore:
    python project_bundle.py restore project_bundle.txt restored_project

Custom output:
    python project_bundle.py pack --output my_project.txt

Limit individual file size:
    python project_bundle.py pack --max-file-size 20

Include files that Git normally excludes globally:
    Not supported intentionally. The script follows Git's standard exclusions.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import stat
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any, Iterable


FORMAT_NAME = "copilot-project-bundle"
FORMAT_VERSION = 1
DEFAULT_OUTPUT = "project_bundle.txt"

# These are excluded as a safety measure even when not present in .gitignore.
# Add project-specific files here if necessary.
SAFETY_EXCLUSIONS = {
    DEFAULT_OUTPUT,
}

# Common locations that should never be bundled accidentally.
ALWAYS_EXCLUDED_PARTS = {
    ".git",
}


def fail(message: str, exit_code: int = 1) -> None:
    print(f"Error: {message}", file=sys.stderr)
    raise SystemExit(exit_code)


def run_git(args: list[str], cwd: Path) -> bytes:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=cwd,
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except FileNotFoundError:
        fail("Git is not installed or is not available in PATH.")

    if result.returncode != 0:
        error = result.stderr.decode("utf-8", errors="replace").strip()
        fail(f"Git command failed: {error or 'unknown Git error'}")

    return result.stdout


def find_repository_root(start: Path) -> Path:
    output = run_git(
        ["rev-parse", "--show-toplevel"],
        cwd=start,
    )

    root_text = output.decode("utf-8", errors="strict").strip()
    if not root_text:
        fail("Could not determine the Git repository root.")

    return Path(root_text).resolve()


def normalize_relative_path(path: Path) -> str:
    return path.as_posix().lstrip("./")


def is_safe_relative_path(path_text: str) -> bool:
    if not path_text or "\x00" in path_text:
        return False

    normalized = path_text.replace("\\", "/")
    pure_path = PurePosixPath(normalized)

    if pure_path.is_absolute():
        return False

    if any(part in {"", ".", ".."} for part in pure_path.parts):
        return False

    return True


def is_excluded(
    relative_path: str,
    output_relative_path: str | None,
) -> bool:
    pure_path = PurePosixPath(relative_path)

    if any(part in ALWAYS_EXCLUDED_PARTS for part in pure_path.parts):
        return True

    if relative_path in SAFETY_EXCLUSIONS:
        return True

    if output_relative_path and relative_path == output_relative_path:
        return True

    return False


def get_git_files(repository_root: Path) -> list[str]:
    """
    Return tracked files plus untracked, non-ignored files.

    - --cached includes tracked files.
    - --others includes untracked files.
    - --exclude-standard applies .gitignore, nested .gitignore files,
      .git/info/exclude, and global Git ignore rules.
    - -z handles spaces, newlines, and unusual filename characters safely.
    """
    output = run_git(
        [
            "ls-files",
            "-z",
            "--cached",
            "--others",
            "--exclude-standard",
        ],
        cwd=repository_root,
    )

    paths: list[str] = []

    for raw_path in output.split(b"\0"):
        if not raw_path:
            continue

        path_text = os.fsdecode(raw_path)
        path_text = path_text.replace(os.sep, "/")

        if is_safe_relative_path(path_text):
            paths.append(path_text)
        else:
            print(
                f"Warning: skipping unsafe or unsupported path: {path_text!r}",
                file=sys.stderr,
            )

    return sorted(set(paths))


def get_directory_entries(file_paths: Iterable[str]) -> list[str]:
    directories: set[str] = set()

    for file_path in file_paths:
        pure_path = PurePosixPath(file_path)

        for parent in pure_path.parents:
            parent_text = parent.as_posix()
            if parent_text != ".":
                directories.add(parent_text)

    return sorted(
        directories,
        key=lambda value: (len(PurePosixPath(value).parts), value),
    )


def sha256_hex(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def get_git_commit(repository_root: Path) -> str | None:
    result = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=repository_root,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )

    if result.returncode != 0:
        return None

    commit = result.stdout.decode("ascii", errors="replace").strip()
    return commit or None


def get_git_branch(repository_root: Path) -> str | None:
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        cwd=repository_root,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )

    if result.returncode != 0:
        return None

    branch = result.stdout.decode("utf-8", errors="replace").strip()
    return branch or None


def calculate_output_relative_path(
    repository_root: Path,
    output_path: Path,
) -> str | None:
    try:
        relative = output_path.resolve().relative_to(repository_root)
    except ValueError:
        return None

    return normalize_relative_path(relative)


def pack_project(
    output: Path,
    max_file_size_mb: float,
) -> None:
    repository_root = find_repository_root(Path.cwd())
    output = output.expanduser().resolve()

    if output.is_dir():
        fail(f"The output path is a directory: {output}")

    output_relative_path = calculate_output_relative_path(
        repository_root,
        output,
    )

    git_files = get_git_files(repository_root)
    file_paths = [
        path
        for path in git_files
        if not is_excluded(path, output_relative_path)
    ]

    directories = get_directory_entries(file_paths)
    max_file_size_bytes = int(max_file_size_mb * 1024 * 1024)

    included_files = 0
    included_symlinks = 0
    skipped_files: list[dict[str, Any]] = []
    total_original_bytes = 0

    output.parent.mkdir(parents=True, exist_ok=True)

    header = {
        "record_type": "header",
        "format": FORMAT_NAME,
        "version": FORMAT_VERSION,
        "created_utc": datetime.now(timezone.utc).isoformat(),
        "project_name": repository_root.name,
        "git_branch": get_git_branch(repository_root),
        "git_commit": get_git_commit(repository_root),
        "encoding": "base64",
        "path_style": "posix-relative",
    }

    try:
        with output.open("w", encoding="utf-8", newline="\n") as bundle:
            bundle.write(json.dumps(header, ensure_ascii=False) + "\n")

            for directory in directories:
                record = {
                    "record_type": "directory",
                    "path": directory,
                }
                bundle.write(json.dumps(record, ensure_ascii=False) + "\n")

            for relative_path in file_paths:
                source_path = repository_root / Path(relative_path)

                try:
                    file_stat = source_path.lstat()
                except OSError as exc:
                    skipped_files.append(
                        {
                            "path": relative_path,
                            "reason": f"could not read metadata: {exc}",
                        }
                    )
                    continue

                if stat.S_ISLNK(file_stat.st_mode):
                    try:
                        target = os.readlink(source_path)
                    except OSError as exc:
                        skipped_files.append(
                            {
                                "path": relative_path,
                                "reason": f"could not read symlink: {exc}",
                            }
                        )
                        continue

                    record = {
                        "record_type": "symlink",
                        "path": relative_path,
                        "target": target,
                    }
                    bundle.write(
                        json.dumps(record, ensure_ascii=False) + "\n"
                    )
                    included_symlinks += 1
                    continue

                if not stat.S_ISREG(file_stat.st_mode):
                    skipped_files.append(
                        {
                            "path": relative_path,
                            "reason": "not a regular file",
                        }
                    )
                    continue

                file_size = file_stat.st_size

                if file_size > max_file_size_bytes:
                    skipped_files.append(
                        {
                            "path": relative_path,
                            "reason": (
                                f"file is {file_size} bytes, exceeding "
                                f"the {max_file_size_bytes}-byte limit"
                            ),
                        }
                    )
                    continue

                try:
                    content = source_path.read_bytes()
                except OSError as exc:
                    skipped_files.append(
                        {
                            "path": relative_path,
                            "reason": f"could not read file: {exc}",
                        }
                    )
                    continue

                executable = bool(file_stat.st_mode & stat.S_IXUSR)

                record = {
                    "record_type": "file",
                    "path": relative_path,
                    "size": len(content),
                    "sha256": sha256_hex(content),
                    "executable": executable,
                    "content_base64": base64.b64encode(content).decode("ascii"),
                }

                bundle.write(json.dumps(record, ensure_ascii=False) + "\n")

                included_files += 1
                total_original_bytes += len(content)

            footer = {
                "record_type": "footer",
                "file_count": included_files,
                "symlink_count": included_symlinks,
                "directory_count": len(directories),
                "original_bytes": total_original_bytes,
                "skipped_count": len(skipped_files),
                "skipped": skipped_files,
            }

            bundle.write(json.dumps(footer, ensure_ascii=False) + "\n")

    except OSError as exc:
        fail(f"Could not create bundle: {exc}")

    bundle_size = output.stat().st_size

    print()
    print("Project bundle created successfully.")
    print(f"Repository:        {repository_root}")
    print(f"Output:            {output}")
    print(f"Files included:    {included_files}")
    print(f"Symlinks included: {included_symlinks}")
    print(f"Directories:       {len(directories)}")
    print(f"Original size:     {total_original_bytes:,} bytes")
    print(f"Bundle size:       {bundle_size:,} bytes")
    print(f"Skipped files:     {len(skipped_files)}")

    if skipped_files:
        print()
        print("Skipped entries:")
        for skipped in skipped_files:
            print(f"  - {skipped['path']}: {skipped['reason']}")

    print()
    print("Security reminder:")
    print("Review the bundle for secrets before uploading it.")
    print(
        "Base64 is an encoding format, not encryption. "
        "Anyone with the bundle can read its contents."
    )


def safe_destination_path(destination_root: Path, relative_path: str) -> Path:
    if not is_safe_relative_path(relative_path):
        fail(f"Unsafe path found in bundle: {relative_path!r}")

    destination = (
        destination_root
        / Path(*PurePosixPath(relative_path).parts)
    ).resolve(strict=False)

    try:
        destination.relative_to(destination_root)
    except ValueError:
        fail(f"Bundle path escapes destination folder: {relative_path!r}")

    return destination


def ensure_no_symlink_parents(
    destination_root: Path,
    destination: Path,
) -> None:
    current = destination.parent

    while current != destination_root:
        if current.is_symlink():
            fail(f"Refusing to write through symlinked directory: {current}")
        current = current.parent


def restore_project(bundle_path: Path, destination: Path) -> None:
    bundle_path = bundle_path.expanduser().resolve()
    destination = destination.expanduser().resolve()

    if not bundle_path.is_file():
        fail(f"Bundle file does not exist: {bundle_path}")

    if destination.exists() and any(destination.iterdir()):
        fail(
            "Destination directory is not empty. "
            "Use a new or empty directory."
        )

    destination.mkdir(parents=True, exist_ok=True)

    restored_files = 0
    restored_directories = 0
    restored_symlinks = 0
    header_seen = False
    footer_seen = False

    try:
        with bundle_path.open("r", encoding="utf-8") as bundle:
            for line_number, line in enumerate(bundle, start=1):
                line = line.strip()
                if not line:
                    continue

                try:
                    record = json.loads(line)
                except json.JSONDecodeError as exc:
                    fail(
                        f"Invalid JSON at line {line_number}: {exc}"
                    )

                record_type = record.get("record_type")

                if record_type == "header":
                    if header_seen:
                        fail("Bundle contains more than one header.")

                    if record.get("format") != FORMAT_NAME:
                        fail("This is not a supported project bundle.")

                    if record.get("version") != FORMAT_VERSION:
                        fail(
                            "Unsupported bundle version: "
                            f"{record.get('version')!r}"
                        )

                    header_seen = True
                    continue

                if not header_seen:
                    fail("Bundle data appeared before the header.")

                if record_type == "directory":
                    relative_path = record.get("path")
                    if not isinstance(relative_path, str):
                        fail(
                            f"Invalid directory record at line {line_number}."
                        )

                    target = safe_destination_path(
                        destination,
                        relative_path,
                    )
                    ensure_no_symlink_parents(destination, target)
                    target.mkdir(parents=True, exist_ok=True)
                    restored_directories += 1

                elif record_type == "file":
                    relative_path = record.get("path")
                    encoded_content = record.get("content_base64")
                    expected_hash = record.get("sha256")
                    executable = bool(record.get("executable", False))

                    if not isinstance(relative_path, str):
                        fail(
                            f"Invalid file path at line {line_number}."
                        )
                    if not isinstance(encoded_content, str):
                        fail(
                            f"Invalid file content at line {line_number}."
                        )
                    if not isinstance(expected_hash, str):
                        fail(
                            f"Missing checksum at line {line_number}."
                        )

                    try:
                        content = base64.b64decode(
                            encoded_content,
                            validate=True,
                        )
                    except (ValueError, base64.binascii.Error) as exc:
                        fail(
                            f"Invalid Base64 content at line {line_number}."
                        )

                    actual_hash = sha256_hex(content)
                    if actual_hash != expected_hash:
                        fail(
                            f"Checksum mismatch for {relative_path!r}. "
                            "The bundle may be damaged."
                        )

                    target = safe_destination_path(
                        destination,
                        relative_path,
                    )
                    ensure_no_symlink_parents(destination, target)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(content)

                    if executable and os.name != "nt":
                        mode = target.stat().st_mode
                        target.chmod(
                            mode
                            | stat.S_IXUSR
                            | stat.S_IXGRP
                            | stat.S_IXOTH
                        )

                    restored_files += 1

                elif record_type == "symlink":
                    relative_path = record.get("path")
                    link_target = record.get("target")

                    if not isinstance(relative_path, str):
                        fail(
                            f"Invalid symlink path at line {line_number}."
                        )
                    if not isinstance(link_target, str):
                        fail(
                            f"Invalid symlink target at line {line_number}."
                        )

                    target = safe_destination_path(
                        destination,
                        relative_path,
                    )
                    ensure_no_symlink_parents(destination, target)
                    target.parent.mkdir(parents=True, exist_ok=True)

                    if target.exists() or target.is_symlink():
                        fail(f"Cannot overwrite existing path: {target}")

                    try:
                        target.symlink_to(link_target)
                    except OSError as exc:
                        print(
                            f"Warning: could not restore symlink "
                            f"{relative_path!r}: {exc}",
                            file=sys.stderr,
                        )
                        continue

                    restored_symlinks += 1

                elif record_type == "footer":
                    footer_seen = True

                else:
                    fail(
                        f"Unknown record type at line {line_number}: "
                        f"{record_type!r}"
                    )

    except OSError as exc:
        fail(f"Could not restore bundle: {exc}")

    if not header_seen:
        fail("Bundle header was not found.")

    if not footer_seen:
        fail("Bundle footer was not found. The file may be incomplete.")

    print()
    print("Project restored successfully.")
    print(f"Destination:         {destination}")
    print(f"Files restored:      {restored_files}")
    print(f"Directories created: {restored_directories}")
    print(f"Symlinks restored:   {restored_symlinks}")


def positive_number(value: str) -> float:
    try:
        number = float(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(
            "must be a number"
        ) from exc

    if number <= 0:
        raise argparse.ArgumentTypeError(
            "must be greater than zero"
        )

    return number


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Create or restore a text-based project bundle that "
            "respects Git ignore rules."
        )
    )

    subparsers = parser.add_subparsers(
        dest="command",
        required=True,
    )

    pack_parser = subparsers.add_parser(
        "pack",
        help="Create a text bundle from the current Git repository.",
    )
    pack_parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path(DEFAULT_OUTPUT),
        help=f"Output text file. Default: {DEFAULT_OUTPUT}",
    )
    pack_parser.add_argument(
        "--max-file-size",
        type=positive_number,
        default=25.0,
        metavar="MB",
        help=(
            "Maximum size of one file in megabytes. "
            "Default: 25 MB"
        ),
    )

    restore_parser = subparsers.add_parser(
        "restore",
        help="Restore a project from a text bundle.",
    )
    restore_parser.add_argument(
        "bundle",
        type=Path,
        help="Path to the project bundle text file.",
    )
    restore_parser.add_argument(
        "destination",
        type=Path,
        help="New or empty destination directory.",
    )

    return parser


def main() -> None:
    parser = build_argument_parser()
    args = parser.parse_args()

    if args.command == "pack":
        pack_project(
            output=args.output,
            max_file_size_mb=args.max_file_size,
        )
    elif args.command == "restore":
        restore_project(
            bundle_path=args.bundle,
            destination=args.destination,
        )
    else:
        parser.error("Unknown command.")


if __name__ == "__main__":
    main()