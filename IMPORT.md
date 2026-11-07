# EmVB daisyUI WP1-WP6 conflict-free overlay

This overlay only adds `packages/emvb-daisyui`. It does not replace EmVB core files, the root
`package.json`, or `bun.lock`. The existing `packages/*` workspace discovers it automatically.

```bash
git fetch /path/to/EmVB-daisyui-wp6-overlay.bundle daisyui-wp6-overlay
git merge --allow-unrelated-histories --no-ff FETCH_HEAD -m "feat: add EmVB daisyUI provider WP1-WP6"
bun install
bun run --cwd packages/emvb-daisyui generate
bun test packages/emvb-daisyui/src
```

If an older `packages/emvb-daisyui` overlay is already installed, replace it on a dedicated branch
or import the incremental WP6 archive instead. Two branches that both add the same package paths can
produce add/add conflicts.
