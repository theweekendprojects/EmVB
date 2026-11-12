# Bundle F: WP24 real conformance and WP30 release qualification

## WP24

`bun daisy:conformance` now compiles real CSS using the repository-pinned `@tailwindcss/vite` 4.1.17, `tailwindcss` 4.1.17 and `daisyui` 5.7.50. It generates a safelist from the 68-component catalog, compiles the official plugin, checks the verified-selector boundary and every unique catalog root selector, then writes `generated/official-conformance.json`. CI runs the conformance, provider build and package smoke gates.

## WP30

`bun daisy:qualify` creates machine-readable logs and a qualification verdict under `artifacts/daisy-release`. It runs provider tests, all daisyUI tests, provider build/smoke, official CSS compilation, full repository checks and the Cloudflare build. Browser qualification is enabled with `DAISY_QUALIFY_BROWSERS=1`; live Worker qualification requires `DAISY_LIVE_URL` plus empty/static/interactive routes. Missing browser installation or live deployment is reported as BLOCKED, never PASS.

Playwright qualification covers axe WCAG A/AA serious and critical violations, Modal open/Escape/focus return, and Tabs Arrow/Home/End behavior. The live checker proves: empty route has no daisyUI assets; static route has CSS and no runtime; interactive route has CSS and runtime.

## Production command

```bash
bun install --frozen-lockfile
bunx playwright install --with-deps chromium
DAISY_QUALIFY_BROWSERS=1 \
DAISY_LIVE_URL=https://your-worker.example \
DAISY_EMPTY_ROUTE=/ \
DAISY_STATIC_ROUTE=/daisy-static \
DAISY_INTERACTIVE_ROUTE=/daisy-interactive \
bun daisy:qualify
```

A release is qualified only when `artifacts/daisy-release/result.json` says `PASS`.
