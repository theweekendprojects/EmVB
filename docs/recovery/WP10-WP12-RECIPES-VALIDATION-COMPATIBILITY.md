# EmVB daisyUI WP10-WP12 implementation and recovery guide

## Baseline

This work is based on WP13 commit `7cc9d52`, which integrated the generated daisyUI provider into the EmVB editor. The original reconstructed source bundle identifies revision `9a469d8bfd062fccce6035912ba016661fe6b845` as provenance. WP10-WP12 are implemented in `packages/emvb-daisyui` and deliberately avoid changing the EmVB core schema again.

## WP10: Page and section recipes

The recipe API is in `src/recipes/index.ts`. It exports:

- `DAISY_RECIPES`, the immutable recipe catalog.
- `recipeById(id)`, a lookup helper.
- `createRecipe(id, idFactory)`, which creates fresh semantic nodes.
- `DaisyRecipe` and `DaisyRecipeId` types.

The ten recipes are Pricing, FAQ, Login, Signup, Contact, Product grid, Blog grid, Team grid, Dashboard statistics, and Navigation shell. Recipes use the provider's `createNode()` function, merge semantic props with generated defaults, and require an injected ID factory so inserts never reuse persisted IDs.

A recipe returns one or more `DaisyComponentNode` roots. It does not return HTML, CSS classes, or framework-specific components. This keeps recipe JSON compatible with the editor, version history, clipboard, publishing, migrations, and the generated renderer.

### Recipe invariants

1. Every component id must exist in `daisyUIProvider.components`.
2. Every emitted node id must be unique across the recipe insertion.
3. Every recipe must pass `validateDaisyTree()`.
4. Recipes must store semantic props only. They must not persist generated daisyUI or Tailwind classes.
5. The host must allocate IDs using the same collision-safe mechanism used for normal editor inserts.

## WP11: Accessibility and validation

The validation API is in `src/validation/index.ts`. It exports `validateDaisyTree()` for non-throwing inspection and `assertValidDaisyTree()` for save/build gates.

Validation currently reports these stable codes:

- `unknown-component`
- `unknown-property`
- `invalid-option`
- `invalid-value`
- `missing-label`
- `invalid-nesting`
- `duplicate-id`

The validator checks the live generated catalog, not a second hand-maintained property list. Field types and select choices therefore remain aligned with the renderer generator. `theme` is accepted as provider metadata. Interactive controls require a non-empty label, text, or alt value. Leaf components reject children.

Recommended integration points:

- Run validation before saving or publishing a Daisy recipe.
- Show issues by `nodeId` in the editor settings panel.
- Reject `unknown-component`, `invalid-value`, and `duplicate-id` as errors.
- Treat `missing-label` as a publish-blocking accessibility error.
- Keep future axe-core and keyboard/browser checks in WP11 browser coverage, because structural validation cannot prove focus trapping or keyboard operation.

## WP12: Upgrade and compatibility

The compatibility API is in `src/compatibility/index.ts`. It exports:

- `DAISY_CATALOG_VERSION`, currently 1.
- Supported package ranges for daisyUI 5 and Tailwind CSS 4.
- `migrateDaisyLayout()` for deterministic semantic migrations.
- `compatibilityReport()` for duplicate IDs, missing classes, incomplete class maps, component count, and generated class count.

Layouts that need portable daisyUI versioning use this envelope:

```json
{
  "catalogVersion": 1,
  "nodes": []
}
```

The migration walker is recursive. It preserves node IDs, component IDs, children, and unrelated props. Version 0 compatibility includes legacy property renames for Button, Badge, and Alert. A layout with a catalog version newer than the installed package is rejected rather than silently downgraded.

### Upgrade procedure

1. Update `daisyui` or `tailwindcss` in `packages/emvb-daisyui/package.json`.
2. Run `bun install` and commit `bun.lock`.
3. Run the generator.
4. Run `compatibilityReport()` and fail CI if `compatible` is false.
5. Review regenerated `generated/safelist.css` and `generated/component-gallery.json`.
6. Run all package tests.
7. Run Playwright visual snapshots against the component gallery.
8. If a component or property changed, increment `DAISY_CATALOG_VERSION` and add a deterministic migration.
9. Test a fixture from every older supported catalog version.

## Package exports

Consumers can import the complete API from `@perkyzz/emvb-daisyui` or use focused exports:

- `@perkyzz/emvb-daisyui/recipes`
- `@perkyzz/emvb-daisyui/validation`
- `@perkyzz/emvb-daisyui/compatibility`

## Test isolation

The repository root Bun configuration preloads Happy DOM for editor tests. The Daisy provider package is runtime-independent, so `packages/emvb-daisyui/bunfig.toml` disables preloads for package-local tests. This prevents a missing optional browser-test dependency from blocking pure catalog, recipe, validation, and migration tests.

Run:

```bash
cd packages/emvb-daisyui
bun test src
```

Expected result at this commit: 58 tests passing across 10 files.

## Release checklist

```bash
cd /path/to/EmVB
bun install
bun run --cwd packages/emvb-daisyui generate
bun run --cwd packages/emvb-daisyui test
git diff --check
git fsck --full
```

Additionally run the EmVB editor and Astro browser parity scenario documented in `WP13-EDITOR-INTEGRATION-RECOVERY.md`.

## Disaster recovery

If Git history is lost but the project tree survives, preserve these directories first:

- `packages/emvb-daisyui/src/recipes`
- `packages/emvb-daisyui/src/validation`
- `packages/emvb-daisyui/src/compatibility`
- `packages/emvb-daisyui/src/components`
- `packages/emvb-daisyui/generated`
- `docs/recovery`

Reconstruct the baseline, apply WP13, then apply the WP10-WP12 bundle. Run package tests before integrating new work. The next product work should not add more component families. It should wire recipes into the EmVB Add panel, expose validation issues in editor and publish flows, and add Playwright visual regression for the generated gallery.
