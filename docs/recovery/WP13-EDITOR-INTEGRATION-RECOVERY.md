# WP13 daisyUI editor integration recovery guide

## Recovery identity

- Source archive: `project_bundle.txt` (NDJSON project bundle)
- Archive metadata revision: `9a469d8bfd062fccce6035912ba016661fe6b845`
- Local reconstruction baseline: the parent of the WP13 commit in this bundle
- Packages: EmVB 0.9.0 and `@perkyzz/emvb-daisyui` 0.1.0
- Toolchain: Bun 1.4+, Node 24, React 19, Astro 7, Tailwind CSS 4, daisyUI 5

The text archive contains files, not the original Git objects. Its revision is provenance only.

## Work-package ledger

| WP | State |
| --- | --- |
| WP1 Provider foundation | Complete |
| WP2 Catalog and generator | Complete |
| WP3 Themes | Complete |
| WP4 Basic components | Complete |
| WP5 Forms | Complete |
| WP6 Navigation | Complete |
| WP7 Interactive components | Complete |
| WP8 Data display | Complete |
| WP9 Layout and marketing | Complete |
| WP13 Editor integration | Implemented by this bundle |
| WP10 Recipes | Next |
| WP11 Accessibility and validation | Pending |
| WP12 Upgrade and compatibility | Pending |

## Persisted model

WP13 uses one permanent EmVB node type, `daisy`. The `component` field chooses an allowlisted provider component; `props` contains semantic values. Palette and drag operations use `daisy:<component-id>` only as a transient insertion identifier.

```json
{
  "id": "daisyBtn01",
  "type": "daisy",
  "component": "button",
  "props": {
    "text": "Buy now",
    "tone": "primary",
    "variant": "outline",
    "size": "lg",
    "theme": "corporate"
  }
}
```

Never persist `type: "daisy:button"`.

## Integration flow

1. `AddPanel.tsx` reads `daisyUIProvider.components`.
2. Generated components appear in a dedicated **daisyUI** group.
3. Search includes component name and catalog category.
4. Click and drag emit `daisy:<id>`.
5. `new-element.ts` validates the id and calls `createNode()`.
6. `useNodeActions.ts` uses normal EmVB placement, so history, undo, redo, duplicate, save and publish use existing machinery.
7. `layout.ts` validates the saved `daisy` node.
8. `ElementPanel.tsx` resolves the generated descriptor and reuses `FieldControl`.
9. Theme values are stored as semantic props and rendered as `data-theme`.
10. Core rendering delegates to `daisyUIProvider.render()` in both editor and public modes.

## Generator rule

Generated descriptor keys must be direct property keys such as `text`, not `props.text`. EmVB `FieldControl` already reads and updates `node.props`.

## Changed files

- `packages/emvb/package.json`
- `packages/emvb-daisyui/src/generator/generate.ts`
- `packages/emvb/src/core/schema/layout.ts`
- `packages/emvb/src/core/elements/index.ts`
- `packages/emvb/src/admin/editor/dnd/new-element.ts`
- `packages/emvb/src/admin/editor/panels/AddPanel.tsx`
- `packages/emvb/src/admin/editor/panels/LeftPanel.tsx`
- `packages/emvb/src/admin/editor/useNodeActions.ts`
- `packages/emvb/src/admin/editor/panels/ElementPanel.tsx`

## CSS contract

Both the editor canvas and published Astro site must process the same entry point:

```css
@import "@perkyzz/emvb-daisyui/styles.css";
```

It registers Tailwind, the daisyUI plugin, supported themes, the source catalog and generated safelist. Correct markup with no daisyUI styling usually means this shared stylesheet was omitted from the host build.

## Theme contract

Supported theme values are inherit, light, dark, corporate, business and cupcake. Explicit values become `data-theme` on the generated root. Inherit is stored as an empty or absent value.

## Security boundaries

- Only provider-registered components can be inserted.
- Component ids use a restricted lowercase identifier.
- Props are strings, finite numbers or booleans.
- Arbitrary Tailwind classes are not persisted.
- Catalog class maps remain the allowlist.
- Unknown components render a safe placeholder.

## Clean verification

```bash
rm -rf node_modules
bun install
bun run --cwd packages/emvb-daisyui generate
bun test packages/emvb-daisyui/src
bun run check
git diff --check
git fsck --full
```

Browser parity scenario:

1. Open Add and search `button`.
2. Drag the daisyUI Button into a container.
3. Change text, tone, variant, size and theme.
4. Save and reload.
5. Undo and redo a property change.
6. Duplicate and publish.
7. Compare editor and public classes and `data-theme`.
8. Run the Node Playwright project.

## Dependency disaster recovery

A partial Bun install can report missing `zod`, `happy-dom`, `@cloudflare/kumo`, React or Playwright exports. Recover before diagnosing source code:

```bash
rm -rf node_modules
bun install
```

Commit the updated `bun.lock` after dependency resolution.

## Text-bundle disaster recovery

If only `project_bundle.txt` survives:

1. Parse each NDJSON line.
2. Create directory records.
3. Base64-decode file records.
4. Verify decoded length against `size`.
5. Verify SHA-256 against `sha256`.
6. Restore executable bits.
7. Initialize Git and commit the exact reconstruction.
8. Fetch and merge this WP13 bundle.
9. Run the verification procedure.

## Importing this Git bundle

```bash
git fetch /path/to/EmVB-daisyui-wp13-editor-integration.bundle wp13-editor-integration
git merge --no-ff FETCH_HEAD -m "feat: integrate daisyUI provider into EmVB editor"
bun install
```

If Git reports unrelated histories, the recipient repository was not initialized from the same reconstructed source snapshot. Do not use `--allow-unrelated-histories`; instead compare the source tree or cherry-pick the WP13 patch onto the correct WP9 baseline.

## Remaining roadmap

Proceed with WP10 recipes, then WP11 accessibility hardening, then WP12 upgrade compatibility. WP12 should add catalog-version metadata, property migrations, removed-class checks and Playwright visual snapshots.
