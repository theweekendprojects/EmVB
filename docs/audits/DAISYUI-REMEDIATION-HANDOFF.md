# daisyUI remediation handoff (for GitHub Copilot)

**Audience:** GitHub Copilot (the implementing agent) + a human reviewer.
**Status:** the integration *seam* is done and proven live on Cloudflare; the daisyUI *components*
are still at the audit's "experimental" bar. This file lists exactly what is proven, what is
broken, and what to build next — in priority order, file/symbol level.

**Companion docs:** read `docs/audits/DAISYUI-CONFORMANCE-AUDIT.md` first (the findings ledger:
C-01..C-04, H-01..H-11, R1..R8). This handoff is the *current* state after the remediation branch
landed and after a live prod test on Cloudflare.

---

## 0. TL;DR — what is done vs open

**DONE (merged to `main`, verified green + live):**
- Gates: `typecheck`, `test` (3830 pass / 0 fail), `daisy:test` (71/0), `providers:smoke`, and the
  full `check` aggregate all pass. Repo normalized CRLF→LF + `.gitattributes`.
- C-01 / R2 provider seam: `emvb({ providers, adminEntry })` registers an external provider on the
  server (render) and in the browser editor (via an `adminEntry` wrapper). `emvb-provider-api`'s
  registry is shared on `globalThis` so all worker bundles see one registry.
- H-01 / schema v18: `provider` node + `17→18` migration (`daisy`→`provider`), fixtures, docs.
- Verified LIVE on a real EmDash + Cloudflare site (the `theweekendprojects-landing-page`): the
  daisyUI group shows in the editor Add panel; placing **Button** and publishing renders
  `<button class="emvb-provider btn btn-primary btn-md">` on the public page with zero
  "Unknown provider" fallbacks; a page with no daisyUI element renders zero daisyUI output (no
  component leak).

**OPEN (what the live test exposed — your job):**
1. **Component props are not editable.** Placing most daisyUI components shows no usable field
   editor; text/label/variant cannot be changed from the panel. (audit C-02, C-04)
2. **Experimental components have no edit surface at all** (Browser Mockup, Carousel, Modal,
   Drawer, Table, Menu, Accordion, Tabs, etc.). They render a static default and cannot be
   configured. (audit C-04, H-02..H-06)
3. **daisyUI theme is not applied** — `btn-primary` shows no fill because no `data-theme` is set on
   the EmVB page wrapper, so daisyUI's theme CSS variables never resolve. (plan §4.1 / M-01)
4. **CSS ships on every route** — the Tailwind/daisyUI stylesheet is inlined on non-daisyUI pages
   too (host-side `inlineStylesheets:"always"` hoists the global import). Perf, not correctness.
5. The broad catalog is still handwritten, not generated, and conformance does not compile real
   official CSS. (audit C-02, C-03)

Do them roughly in this order: **3 (quick, high-visibility) → 1 (makes the verified 10 usable) →
2 (compound + interactive) → 4 (perf) → 5 (truthful "generated"/conformance).**

---

## 1. How the pieces fit (so you edit the right file)

Component registration + rendering is provider-based now:

```
@perkyzz/emvb-provider-api   contracts + the globalThis-shared registry
  src/types.ts               ProviderComponent, ProviderComponentDescriptor, ProviderFieldDescriptor,
                             ProviderFieldKind, ProviderComponentNode, ProviderVNode, ProviderRenderContext
  src/registry.ts            registerComponentProvider / componentProvider(s)  (globalThis map)

@perkyzz/emvb-daisyui        the daisyUI provider itself
  src/provider.ts            builds `daisyUIProvider` from the catalog + DAISY_RECIPES; self-registers
  src/render/provider.ts     createDaisyUIProvider(definitions, recipes): the ComponentProvider impl
  src/generator/generate.ts  generateComponent(definition) -> GeneratedDaisyComponent (descriptor+build)
  src/catalog/*.ts           the component DEFINITIONS (fields, rootClass, classMap, build)
  src/catalog/index.ts       DAISY_COMPONENT_CATALOG (the full list)
  src/recipes/index.ts       DAISY_RECIPES (+ setRecipeCreateNode)
  src/themes/index.ts        theme config / generateBrandTheme
  src/compound/*             compound-node rendering (tab/accordion/menu parts) — INCOMPLETE
  src/verified/primitives.ts the 10-component "verified" subset list
  generated/safelist.css     Tailwind safelist (keeps runtime classes); generated/component-gallery.json

@perkyzz/emvb (core)         consumes providers; never imports emvb-daisyui
  src/core/elements/index.ts providerElement.build(): renders a `provider` node via
                             componentProvider(node.provider).render(...); falls back to
                             .emvb-unknown "Unknown provider" when not registered
  src/core/schema/layout.ts  ProviderNode schema + type (manual recursive type), LAYOUT_SCHEMA_VERSION=18
  src/admin/editor/panels/ElementPanel.tsx   the RIGHT panel: daisyDescriptor(node) builds the field
                             list for a provider node from generated.descriptor.fields (+ a Theme select)
  src/admin/editor/panels/AddPanel.tsx       the Add panel: providerDescriptors + provider recipes
  src/admin/editor/useNodeActions.ts         recipe insert (native:/provider:<id>:<recipe> scheme)
```

The editor's field kinds (what a prop editor can be) are in
`packages/emvb/src/core/schema/descriptors.ts` (`FieldKind`): `text | textarea | number | int |
select | boolean | href | media | icon | list-items | image-sources`. The provider contract's
field kinds (`ProviderFieldKind`) are a subset: `text | textarea | number | select | boolean | href`.

---

## 2. OPEN-3 — Apply a daisyUI theme (do first; small, high visual payoff)

**Symptom:** the published Button has the right classes and daisyUI CSS is present, but no fill —
`getComputedStyle` showed a transparent background and a pill radius. daisyUI v5 colours come from
theme CSS variables that only exist under an element with `data-theme`.

**Fix:**
- `packages/emvb-daisyui/src/render/provider.ts` already reads `providerMeta.theme` via core's
  `providerElement.build` (it adds `data-theme` when `meta.theme` is a string). But nothing sets a
  DEFAULT theme, so a freshly placed node has no theme and the page wrapper has none either.
- Decide the source of truth: a site-level default theme (recommended) + an optional per-node
  `providerMeta.theme` override. Set `data-theme="light"` (or the chosen default) on the EmVB page
  wrapper that `EmVBPage` renders, so every daisyUI component inherits a resolved theme.
- Confirm the themes compiled by `@plugin "daisyui"` (see `styles/emvb-daisyui.css`) match the set
  offered in the Theme select in `ElementPanel.tsx` (`DAISY_THEMES`). Keep them in sync.
- **Acceptance:** publish a Button, load the public page, `getComputedStyle(btn).backgroundColor`
  is the theme's primary colour (not transparent).

---

## 3. OPEN-1 — Make the verified-10 components' props editable

**Symptom:** placing e.g. Button/Alert/Badge, the right panel shows no working field editor; text
and variant can't be changed.

**Where:** `ElementPanel.tsx` `daisyDescriptor(node)` builds the descriptor from
`generated.descriptor.fields`. Trace it end to end:
1. `packages/emvb-daisyui/src/generator/generate.ts` — does `generateComponent` emit a
   `descriptor.fields` array (key/kind/label/options) for each definition? If fields are empty or
   malformed, the panel has nothing to render. Verify each VERIFIED component
   (`src/verified/primitives.ts`: Button, Badge, Alert, Card, Input, Textarea, Select, Checkbox,
   Toggle, Progress) produces complete fields.
2. `ElementPanel.tsx` — confirm the built descriptor is actually passed to the generic field
   renderer and that edits write back to `node.props`. Provider nodes store props in
   `node.props` (a `Record<string, string|number|boolean>`), NOT in a style object. Make sure the
   panel's onChange updates `props[key]` and the canvas re-renders.
3. The field kinds must be ones the panel knows (`descriptors.ts` `FieldKind`). `text` label,
   `select` for variant/size, `boolean` for outline, `href` for a link. Map daisyUI field kinds to
   those.
- **Acceptance (per verified component):** place it, change every field in the panel, see the
  canvas update immediately, publish, and the public HTML reflects the change. Add an e2e that does
  this for Button (variant primary→secondary changes the class).

---

## 4. OPEN-2 — Compound + interactive components (the big one)

This is audit **C-04 / R6 / R7**. The experimental components (Browser Mockup, Carousel, Modal,
Drawer, Table, Menu, Accordion, Tabs, Chat Bubble, Timeline, Navbar, Footer) currently render a
static default and have no edit surface.

**Compound model (C-04):** these are not single nodes — they have typed children (MenuItem, Tab +
TabPanel, AccordionItem, Table rows/cells, CarouselItem). The audit's "Correct compound model"
section is the target shape. Today they are flattened (textarea strings) or not modelled.
- Build typed child nodes so the editor can add/reorder/edit each part (item-level drag).
- `packages/emvb-daisyui/src/compound/*` is the start; it is incomplete.
- Keep a migration from the legacy textarea format (migration input only).

**Interactive runtime (R7, H-02..H-06):**
- Modal must use the native `<dialog>` + `showModal()` (not an `open` attribute), unique id, close
  form, Escape + focus behaviour.
- Tabs must implement the WAI-ARIA keyboard contract (arrows, Home/End, roving tabindex). **Prefer
  reusing EmVB's existing tabs/accordion runtimes** (`packages/emvb/src/astro/tabs`, `.../menu`,
  the accordion element) over daisyUI's CSS-only tricks.
- **Editor preview state must never be serialized** (H-02): `open`, selected tab, expanded drawer
  are editor-only; only explicit `defaultOpen`/`defaultSelected` with defined public semantics may
  persist. Use the `ProviderRenderContext.mode === "editor"` + `previewState` channel.
- Keyboard/focus Playwright tests per interactive component.
- **Acceptance:** each interactive component is configurable in the editor, published with correct
  markup, passes axe + keyboard/focus e2e, and no preview state leaks into the saved layout.

---

## 5. OPEN-4 — Keep the daisyUI CSS off non-daisyUI pages (perf)

**Symptom:** the ~200KB Tailwind/daisyUI stylesheet inlines on every `/pages/*` route, not just
pages that use a daisyUI component. Root cause is host-side: the consuming site inlines a global
`@import "tailwindcss"` stylesheet into the shared layout.

This is a **host integration** concern more than a fork concern, but document the supported pattern
so hosts don't bloat every page:
- Ship a prebuilt, static daisyUI stylesheet (compiled once with the safelist) and let the host
  `<link>` it conditionally, only when the rendered page actually contains a `provider` node.
- Or expose the compiled CSS as a provider `cssEntryPoints` asset the host can include on demand.
- Document this in the README's "consuming-site requirements".
- **Acceptance:** a non-daisyUI page's HTML contains no daisyUI rules; a daisyUI page does.

---

## 6. OPEN-5 — "Generated" catalog + real conformance (C-02 / C-03)

- The catalog in `src/catalog/*` is handwritten but described as generated. Either build a real
  generator from official daisyUI 5.7.50 metadata, or stop calling it generated and own that it is
  curated.
- `src/conformance/*` must compile CSS with the exact official packages and assert each required
  selector exists in emitted CSS (not just check local metadata against itself). Wire it into CI so
  a dependency bump produces a conformance report before merge.
- Keep the exact pins: `daisyui 5.7.50`, `tailwindcss 4.1.17`.

---

## 7. Rules you must not break

- **EmVB core must never import `@perkyzz/emvb-daisyui`.** The graph stays
  `emvb → provider-api ← daisyui`. (C-01)
- **The provider registry is on `globalThis`** (`Symbol.for("emvb:component-providers")`). Do not
  revert it to a module-local Map — a worker splits bundles and the public render would stop seeing
  the provider (this was a real, live bug: "Unknown provider" on the published page).
- **Variant/size/colour values come from fixed enums; free text only goes into text children**
  (escaped by the VNode renderer). Never emit tenant/user strings into `class`/attrs unescaped.
- **Keep every gate green.** Run `bun install` then `bun run check` before you push. If you change
  AddPanel / the migration / the schema version / a catalog definition, update the matching seeds
  in `scripts/seeded-bugs.json` (the harness checks exact source anchors) and the golden fixtures
  (`test/fixtures/node-shapes-golden.json`, `arrange-golden.json`, `arrange-moves-golden.json`).
- **Schema:** if you add a persisted field to the provider node, bump `LAYOUT_SCHEMA_VERSION` and
  add a migration + fixtures (see how 17→18 was done in `src/core/migrate/index.ts`).
- **Don't serialize editor preview state** (H-02).

---

## 8. How to verify your work (do all of these)

Local (Node ≥ 22.18, `bun` installed):
```bash
bun install
bun run check          # lint + fmt + typecheck + fallow + runtime + seeds + test + test:astro
bun run daisy:test
bun run providers:smoke
```

Live (the real gate — a consuming EmDash + Cloudflare site):
- Build the consuming site, deploy to a Worker, and in the editor: place each component, edit every
  field, publish, and confirm the public HTML + computed styles. The reference site used for the
  first proof was `theweekendprojects-landing-page` (it wires `emvb({ providers:
  ["@perkyzz/emvb-daisyui"], adminEntry: "/src/emvb-admin.ts" })` and imports the provider in its
  `pages/[slug].astro` render graph + a `DaisyStyles` component).
- Negative test: a page with no daisyUI component must render zero daisyUI output.
- Clean up any test pages/sites you create.

When you are done, commit with a clear message and push. Then the review agent will pull, re-run the
gates, and re-test the editor + published pages live.

---

## 9. Definition of done for this handoff

- Every VERIFIED-10 component is fully editable in the panel and renders correctly published, with a
  resolved daisyUI theme (fill visible).
- Interactive components (at least Modal + Tabs + Accordion) are editable, keyboard/focus-correct,
  and never leak preview state.
- `bun run check` green; new e2e for a placed daisyUI component (edit → publish → assert markup +
  axe) passes.
- The audit's stop-ship conditions that are in scope here are cleared; anything still experimental
  is clearly flagged in the Add panel and README.
