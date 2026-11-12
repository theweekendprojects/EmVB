# WP14 daisyUI product integration

WP14 turns the WP10 recipe library into editor functionality. It is based on the project-bundle revision `9004637470e449ed09fcbc8c1ea068b93d0a2e8a`, which already includes WP13 and WP10-WP12.

## Implemented flow

- The EmVB Add panel imports `DAISY_RECIPES` from `@perkyzz/emvb-daisyui`.
- Native EmVB recipes use the insertion namespace `native:<id>`.
- Daisy recipes use `daisy:<id>`.
- Search includes recipe name, description, provider and generic recipe keywords.
- The recipe tile displays its provider so native and daisyUI recipes are distinguishable.
- `useNodeActions` creates Daisy recipe trees with fresh IDs, validates them with `validateDaisyTree`, and sends them through the standard EmVB placement path.
- A one-root recipe inserts that root directly. Multi-root recipes receive a normal EmVB container wrapper, preserving ordering and allowing one undo operation.
- Existing unprefixed native recipe IDs remain accepted for backward compatibility with command-palette and older callers.

## Failure behavior

Unknown Daisy recipe IDs, validation failures and creation exceptions are surfaced through the existing editor notice channel. Invalid trees are never inserted. Because recipe insertion uses the existing `place()` path, size limits, parent compatibility, selection, announcements and history behavior remain centralized.

## Verification

```bash
bun test packages/emvb-daisyui/src
bun test packages/emvb/src/admin/editor/panels/daisy-recipes.test.tsx
bun test packages/emvb/src/admin/editor/panels/add-panel.test.tsx
git diff --check
git fsck --full
```

Manual scenario: search for Pricing, insert it into an empty page, confirm the generated container and three cards are selected and saved, undo once, redo once, reload, and publish. Search for Dashboard statistics and confirm the three generated Stats nodes retain unique IDs.

## Recovery

Apply WP13, then WP10-WP12, then this WP14 commit. If only the source project bundle survives, verify every file's SHA-256, initialize Git, commit the exact tree, and apply the WP14 bundle. Do not persist the transient `daisy:<recipe-id>` namespace in layout JSON; only generated `type: "daisy"` nodes are saved.
