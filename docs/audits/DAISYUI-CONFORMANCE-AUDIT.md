# EmVB + daisyUI critical conformance audit and correction plan

Status: **active remediation**  
Audit baseline: WP14 snapshot commit `0482465`  
Official compatibility target: daisyUI `5.7.50`, Tailwind CSS `4.1.17`

## Executive decision

The current implementation is an architecture prototype, not a production-complete daisyUI provider. New feature work is frozen until the critical items below are corrected. The broad 47-component catalog remains available for development, but only the ten-component conformance subset is presented as verified. Every other component is explicitly labeled experimental in the editor palette.

## Official references

- daisyUI repository: https://github.com/saadeghi/daisyui
- daisyUI v5 release notes: https://daisyui.com/docs/v5/
- daisyUI components: https://daisyui.com/components/
- daisyUI themes: https://daisyui.com/docs/themes/
- Modal: https://daisyui.com/components/modal/
- Tabs: https://daisyui.com/components/tab/
- Accordion: https://daisyui.com/components/accordion/
- Collapse: https://daisyui.com/components/collapse/
- Drawer: https://daisyui.com/components/drawer/
- Carousel: https://daisyui.com/components/carousel/
- Menu: https://daisyui.com/components/menu/
- Table: https://daisyui.com/components/table/
- Tailwind source detection: https://tailwindcss.com/docs/detecting-classes-in-source-files
- Bun workspaces: https://bun.com/docs/pm/workspaces

## Severity model

- **Critical:** architecture or behavior can make the integration unsafe or fundamentally misleading.
- **High:** persisted data, accessibility, runtime behavior, packaging, or upgrade safety is materially incomplete.
- **Medium:** maintainability or usability gap that should be fixed before general availability.

## Findings ledger

| ID | Severity | Finding | Current action | Exit criterion |
| --- | --- | --- | --- | --- |
| C-01 | Critical | EmVB core imports the optional daisyUI package while daisyUI also depends on EmVB contracts, creating a conceptual package cycle. | Planned provider API extraction. | `@perkyzz/emvb-provider-api` exists; EmVB and daisyUI depend on it; EmVB core has no daisyUI import. |
| C-02 | Critical | The provider is described as generated, but component structures and allowed classes are handwritten copies of official behavior. | Added exact-version conformance manifest and verified subset. | Every supported component has versioned official fixtures and generated/validated metadata. |
| C-03 | Critical | The former compatibility report only checked local metadata against itself. | Report now distinguishes verified and experimental components and exact package versions. | CI compiles official packages and confirms each required selector exists in emitted CSS. |
| C-04 | Critical | Compound components are flattened into textarea strings. | Architecture redesign planned. | MenuItem, Tab, TabPanel, AccordionItem, Table parts, and CarouselItem are typed child nodes. |
| H-01 | High | A persisted `daisy` node was added while layout schema stayed at 17. | Documented; schema bump intentionally deferred until generic provider-node migration can be atomic. | Schema 18 introduces generic provider nodes, migration 17→18, fixtures, and downgrade preservation. |
| H-02 | High | Editor preview state such as modal/dropdown open state can leak into published props. | Interactive components remain experimental. | Preview state is editor-only and excluded from serialized layouts/public render. |
| H-03 | High | Modal uses an `open` attribute instead of the official recommended `showModal()` interaction. | Modal marked experimental. | Native dialog trigger, unique ID, close form, Escape behavior, focus tests, and public runtime pass. |
| H-04 | High | Tabs do not implement a complete WAI-ARIA keyboard contract. | Tabs marked experimental. | Arrow keys, Home/End, roving tabindex, selected state, controls/label relationships pass Playwright. |
| H-05 | High | Accordion and Collapse models do not faithfully represent official compound structures. | Both remain experimental. | Typed AccordionItem children and unique group behavior pass official fixtures. |
| H-06 | High | Drawer structure/runtime is not guaranteed to match official required parts. | Drawer remains experimental. | Toggle/content/side/overlay parts, unique IDs, close label, responsive behavior, and screenshots pass. |
| H-07 | High | Structural validator is too shallow to be called complete accessibility validation. | Documentation corrected; production claim removed. | Zod, semantic checks, axe-core, keyboard/focus, and relationship checks all run in CI. |
| H-08 | High | Tests mostly show internal consistency, not agreement with official daisyUI. | Added first conformance-boundary tests. | CSS selector compile, official markup fixture, axe, keyboard, parity, and screenshots exist per verified component. |
| H-09 | High | Broad semver ranges were unsafe for handwritten classes. | Fixed: exact daisyUI 5.7.50 and Tailwind 4.1.17 pins. | Controlled dependency upgrade job produces a conformance report before merge. |
| H-10 | High | Package exports raw TypeScript source. | Planned distribution build. | JS, declaration files, CSS, package smoke tests, Node/Vite/Astro/Bun consumer fixtures pass. |
| H-11 | High | Git bundles were reconstructed snapshots rather than proven incremental history. | Documented delivery rule. | Future bundle is created from the user's real base and tested with `git merge --ff-only`. |
| M-01 | Medium | Theme metadata is stored inside component props. | Planned provider metadata split. | Theme is stored in generic provider metadata and cannot collide with official component props. |
| M-02 | Medium | Recipes rely on experimental compound components. | Recipes remain development-only where they include experimental nodes. | Recipe release status derives from every node's conformance state. |
| M-03 | Medium | Broad catalog coverage is advertised without a supported-subset matrix. | Fixed in UI and README. | Generated support report is published with every release. |

## Production support matrix

### Verified boundary

The initial verified subset is intentionally small:

- Button
- Badge
- Alert
- Card
- Input
- Textarea
- Select
- Checkbox
- Toggle
- Progress

“Verified” currently means the component exists, its expected official root selector is mapped, and exact dependency versions are pinned. It does **not yet** mean all final gates have passed. General availability still requires compiled CSS, official markup, rendering parity, accessibility, and visual tests.

### Experimental boundary

All other catalog components are experimental, including Modal, Drawer, Tabs, Accordion, Dropdown, Carousel, Table, Menu, Navbar, Footer, Timeline, Hero, mockups, and recipes containing them.

## Target package architecture

```text
@perkyzz/emvb-provider-api
  ├── provider contracts
  ├── generic provider node schema contract
  ├── descriptors and field contracts
  ├── VNode/render context
  ├── validation issue contracts
  └── CSS entry-point contract

@perkyzz/emvb
  └── depends only on provider-api

@perkyzz/emvb-daisyui
  └── depends only on provider-api

host application
  └── registers daisyUI provider at startup
```

The target persisted node is provider-neutral:

```json
{
  "id": "node123",
  "type": "provider",
  "provider": "daisyui",
  "component": "button",
  "providerVersion": 2,
  "props": { "label": "Save", "tone": "primary" },
  "providerMeta": { "theme": "corporate" }
}
```

Editor preview state is not part of this JSON.

## Correct compound model

```text
Menu
  MenuItem
    MenuItem (nested)

Tabs
  TabItem
    TabLabel
    TabPanel
      arbitrary EmVB children

Accordion
  AccordionItem
    summary
    arbitrary EmVB children

Table
  TableHead
  TableBody
    TableRow
      TableHeaderCell / TableCell

Carousel
  CarouselItem
    arbitrary EmVB children
```

Textarea formats such as `Label|URL` are migration inputs only, not the final visual-editor model.

## Runtime-state rule

Persisted content, preview state, and runtime state are separate:

```ts
interface ProviderRenderContext {
  mode: "editor" | "public";
  previewState?: Readonly<Record<string, unknown>>;
  runtimeCapabilities: ReadonlySet<string>;
}
```

`open`, focus, selected tab, expanded drawer, and hovered tooltip are not serialized unless they are explicitly named `defaultOpen` or `defaultSelected` and have defined public semantics.

## Conformance gates

A component may move from experimental to verified only after all applicable gates pass:

1. Exact daisyUI/Tailwind version pin.
2. Persisted schema round trip.
3. Official root and part selector verification through a real Tailwind build.
4. Approved markup fixture based on official documentation.
5. Editor and public renderer parity.
6. axe-core scan with zero serious or critical violations.
7. Keyboard and focus tests for interactive components.
8. Light and dark screenshots at 375, 768, and 1280 CSS pixels.
9. Layout migration fixture from every supported catalog version.
10. Package consumer smoke tests for Bun, Node, Vite/Astro, and Cloudflare Workers.

## Remediation work packages

### R1: Truthful scope and dependency pinning, started

- Exact daisyUI 5.7.50 and Tailwind CSS 4.1.17 pins.
- Versioned conformance manifest.
- Ten-component initial verified boundary.
- Experimental labels in the Add panel.
- Compatibility report now exposes verified and experimental counts.
- README warning and this audit.

### R2: Provider API extraction

- Create `@perkyzz/emvb-provider-api`.
- Move cross-package types.
- Add provider registry and host registration.
- Remove all `@perkyzz/emvb-daisyui` imports from EmVB core.
- Add a no-provider fallback path.

### R3: Generic provider schema version 18

- Add generic provider node.
- Add 17→18 migration from `daisy` to `provider`.
- Preserve unknown providers.
- Add downgrade/read-only behavior.
- Update fixtures atomically.

### R4: Official build conformance

- Compile CSS with exact official packages.
- Parse emitted CSS and verify selectors.
- Add official-markup fixtures.
- Generate support report artifact.

### R5: Verified primitive subset

- Correct the ten primitive components.
- Add editor/public parity, axe and screenshots.
- Ship only this subset as production-supported.

### R6: Compound node redesign

- Menu, Tabs, Accordion, Table, and Carousel parts.
- Legacy textarea migration.
- Item-level drag, reorder, binding and localization.

### R7: Interactive runtime

- Modal, Drawer, Dropdown and full Tabs behavior.
- Editor-only preview state.
- Minimal runtime capability modules.
- Playwright focus and keyboard tests.

### R8: Packaging and release

- Build `dist` JS, declarations and CSS.
- Consumer smoke fixtures.
- Controlled dependency upgrades.
- Incremental bundle import simulation from the real user Git base.

## Stop-ship conditions

Do not call the provider generally available while any of these are true:

- EmVB core imports the daisyUI implementation directly.
- Schema 17 has two incompatible meanings.
- Interactive preview state is published.
- The compatibility report does not compile real official CSS.
- Compound structures remain textarea serialization.
- Modal/Drawer/Tabs lack keyboard and focus tests.
- The npm package exports only TypeScript source.

## Current remediation state

R1 is implemented in the working tree. R2 is the next engineering change. The schema version remains 17 deliberately until R2 and R3 can be implemented in one migration-safe change rather than creating another half-migrated format.
