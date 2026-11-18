# R8 packaging and release completion

## Distribution outputs

R8 replaces runtime TypeScript exports with built ESM JavaScript under `dist`. Both packages expose conditional `types` and `import` entries. Source files remain included only because the declaration shims re-export the canonical TypeScript types; consumers execute `dist/*.js`, not package source.

### `@perkyzz/emvb-provider-api`

- `dist/index.js`
- `dist/index.js.map`
- `dist/index.d.ts`

### `@perkyzz/emvb-daisyui`

- `dist/index.js` plus shared chunks and source maps
- built subpaths for catalog, themes, recipes, validation, compatibility, and conformance
- `dist/styles.css`
- declaration shims for every public subpath

## Build and package checks

```bash
bun providers:build
bun providers:smoke
npm pack --dry-run --json --ignore-scripts
```

The smoke test imports package names through their real `package.json` export maps, checks the neutral registry, imports catalog and conformance subpaths, creates and renders Button, and verifies the pinned daisyUI version.

Dry-run package checks require these files and fail if any are missing. The verified dry-run sizes in this environment were approximately 2.7 KB for provider-api and 86 KB for emvb-daisyui, before npm registry transport compression differences.

## Release procedure

1. Run `bun install` at the repository root.
2. Run provider API and daisyUI tests.
3. Run `bun providers:build` and `bun providers:smoke`.
4. Compile Tailwind CSS 4.1.17 with daisyUI 5.7.50 and run the CSS conformance CLI.
5. Run axe-core and Playwright browser gates documented by R5-R7.
6. Run `npm pack --dry-run --json --ignore-scripts` in both packages.
7. Publish `@perkyzz/emvb-provider-api` first.
8. Publish `@perkyzz/emvb-daisyui` second.
9. Install both packages into a clean Astro 7 fixture and confirm editor/public parity.
10. Tag the exact Git commit and attach the generated support report.

## Known declaration trade-off

The generated `.d.ts` files re-export canonical types from packaged `src` files. This gives accurate declarations without duplicating type definitions while the repository lacks a complete installed TypeScript declaration toolchain. A later release may replace these shims with rolled-up declarations from API Extractor or `tsc --emitDeclarationOnly`, but runtime exports are already isolated to built ESM JavaScript.
