# EmVB daisyUI WP1-WP7 conflict-free overlay

This cumulative overlay adds only `packages/emvb-daisyui`. It does not replace EmVB core files,
the root `package.json`, or `bun.lock`. The existing `packages/*` workspace discovers it.

```bash
git fetch /path/to/EmVB-daisyui-wp7-overlay.bundle daisyui-wp7-overlay
git merge --allow-unrelated-histories --no-ff FETCH_HEAD -m "feat: add EmVB daisyUI provider WP1-WP7"
bun install
bun run --cwd packages/emvb-daisyui generate
bun test packages/emvb-daisyui/src
```

Import this cumulative overlay into a branch where `packages/emvb-daisyui` does not already exist.
If WP5 or WP6 was already imported, remove that package in a dedicated upgrade commit before merging,
or copy the WP7 package over the previous one and commit the replacement.
