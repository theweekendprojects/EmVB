# Conflict-free import

This overlay contains only `packages/emvb-daisyui`. It intentionally does not contain or modify
EmVB root files such as `package.json`, `bun.lock`, or existing source files.

The existing EmVB workspace glob `packages/*` discovers the package automatically.

## Import into an existing EmVB Git repository

```bash
git fetch /path/to/EmVB-daisyui-wp5-overlay.bundle daisyui-wp5-overlay
git merge --allow-unrelated-histories --no-ff FETCH_HEAD -m "feat: add EmVB daisyUI provider WP1-WP5"
bun install
bun run --cwd packages/emvb-daisyui generate
bun test packages/emvb-daisyui/src
```

If `packages/emvb-daisyui` already exists, remove that partial import or compare it before merging.
The overlay cannot conflict with normal EmVB files because it adds only this new package and this
import note.
