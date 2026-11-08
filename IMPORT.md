# EmVB daisyUI WP8 + WP9 incremental upgrade

This branch is based directly on the WP7 overlay. It changes only `packages/emvb-daisyui` and this note.

```bash
git fetch /path/to/EmVB-daisyui-wp8-wp9-incremental.bundle daisyui-wp89-incremental
git merge --no-ff FETCH_HEAD -m "feat: upgrade EmVB daisyUI provider to WP9"
bun install
bun run --cwd packages/emvb-daisyui generate
bun test packages/emvb-daisyui/src
```
