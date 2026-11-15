# daisyUI official examples as recipes — plan

**Decision:** add daisyUI's official per-component examples to EmVB as **recipes** (option 2), not as
a new per-component "variants" array (option 3) and not only as field options (option 1).

**Status:** proposed, not started. **Audience:** an implementing agent (Copilot) + a human reviewer.
**Date:** 2026-11-15. For: hostmyemdash customers, who get the daisyUI provider through the
multi-site platform.

---

## Why recipes, not a new variants system

daisyUI's site shows each component with many pre-styled examples (Button: outline, with icon,
loading, wide, a button group; Card: with image, with badge, side, actions; etc.). Today EmVB has:

1. **One editable component per daisyUI component.** Its looks are chosen through **fields**
   (Button has Color, Variant solid/outline/dash/soft/ghost/link, Size, Disabled). Most official
   "examples" that are a single class toggle are ALREADY reachable here — no new code needed.
2. **A recipe system** (`packages/emvb-daisyui/src/recipes/index.ts`) that inserts a pre-built,
   named, multi-node section from the Add panel's "Section recipes" group. This is exactly
   "an example as a drop-in variant": the user inserts it fully formed, then edits it.

A third option — a `variants`/`examples` array on each component definition with its own palette
UI — was rejected: it needs a new catalog field, a new palette surface and a new editor path, and
it overlaps almost entirely with what fields + recipes already do. Recipes reuse the existing
palette, keep every inserted node independently editable, and ship to every consumer for free.

Rule of thumb for which mechanism an official example maps to:

- **Single class toggle** (color, size, outline) -> already a **field option**. Do nothing.
- **A compound arrangement** (card with image + badge + actions, a button group, a hero with two
  CTAs, stats row, a form) -> a **recipe**. This plan.

## How a recipe works today (read before adding any)

File: `packages/emvb-daisyui/src/recipes/index.ts`. The current set is pricing, faq, login, signup,
contact, product-grid, blog-grid, team-grid, dashboard-stats, navigation-shell.

- Each recipe is a `DaisyRecipe`: `{ id, name, description, category, create(id) }`.
  `category` is one of `"Marketing" | "Forms" | "Content" | "Application" | "Navigation"`.
- `create(id)` returns `DaisyComponentNode[]`. Build nodes with the module's `node(component, id,
  props, children)` helper — it calls the provider's `createNode` (so defaults are filled) then
  overlays `props`/`children`. NEVER hand-write a node literal unless the component is a compound
  part (e.g. `accordion-item`); the existing faq recipe shows the literal form for those.
- `id` is a fresh-id factory; call `id()` for every node, including children, so a recipe inserted
  twice has no duplicate ids.
- `DaisyRecipeId` is a string-literal union — add the new id there and to `DAISY_RECIPES`.
- Recipes reach the editor through the provider: `provider.ts` passes `DAISY_RECIPES` into
  `createDaisyUIProvider(..., DAISY_RECIPES)` and wires `setRecipeCreateNode` to the provider's
  `createNode` (avoids an import cycle). The Add panel lists them under "Section recipes"; the host
  inserts one via `addRecipe("provider:daisyui:<id>")` in `useNodeActions.ts`, which also runs
  `provider.validate?.(nodes)` before placing them.
- **Props must match the component's field keys**, or the node renders its defaults (or, for a
  missing key, nothing). Check each `node("x", ...)` prop against that component's `fields[].key` in
  `src/catalog/*.ts`. This is the single most common recipe bug.
- An image-bearing example can only use what the daisyUI provider supports today: image fields are
  plain URL strings (Hero `src`, Avatar `src`, Hover Gallery `images`). There is no media-library
  picker for provider fields yet (see `DAISYUI-IMAGE-CAROUSEL-BUGS.md`, FEAT-1), and daisyUI
  carousel slides can't hold child Images (BUG-1). So a "card with image" recipe uses a URL
  placeholder; for real library images, use the NATIVE EmVB Gallery/Carousel instead.

## Scope — do the high-value examples first, not all ~60 components

daisyUI has dozens of components with several examples each; a literal "every example" is hundreds
of recipes and most would just be a field toggle. Add recipes only for examples that are a
compound arrangement. Proposed first batch (one representative example per high-use component),
for review before writing:

| Recipe id (new)        | daisyUI example it mirrors                         | Components used                     |
| ---------------------- | -------------------------------------------------- | ----------------------------------- |
| `card-with-image`      | Card with image, title, body, actions              | card (+ image URL field)            |
| `card-side`            | Side (horizontal) card                             | card                                |
| `button-group`         | Buttons joined in a row                            | join + button x3                    |
| `hero-centered`        | Hero with heading, text and two CTAs               | hero                                |
| `stats-row`            | Horizontal stats with figures                      | stats x3                            |
| `alert-variants`       | Info / success / warning / error alerts stacked    | alert x4 (one per tone)             |
| `navbar-basic`         | Navbar with brand + menu + CTA                     | navbar, menu, button                |
| `tabs-basic`           | Tabbed panels                                      | tabs + tab items                    |
| `chat-thread`          | A two-person chat exchange                         | chat-bubble x3 (alternating side)   |
| `testimonial-cards`    | Three quote cards                                  | card x3                             |

Hold the long tail (every size/color permutation) — those are field options, not recipes.

## Steps for the implementing agent

1. Read `src/recipes/index.ts` and three or four `src/catalog/*.ts` files for the components you'll
   use; note each component's exact field keys and defaults.
2. For each new recipe: add its id to `DaisyRecipeId`, add the `DaisyRecipe` entry to
   `DAISY_RECIPES`, build nodes with the `node()` helper, and set only props whose keys exist on
   the component.
3. Keep every recipe's output valid: run `provider.validate` mentally (the editor runs it on
   insert). A compound parent (accordion/tabs/carousel) must contain only its own part type.
4. Add or extend a recipe test. There is a conformance test harness in the package
   (`bun run --cwd packages/emvb-daisyui test`); add a test that, for every recipe in
   `DAISY_RECIPES`, `create(idFactory)` yields nodes whose every prop key exists on its component's
   catalog definition, and whose ids are unique. That one test guards the whole batch and fails on
   the "prop key doesn't match a field" mistake.
5. Verify: `bun run typecheck`, `bun run daisy:test`. Then build the consuming landing page
   (`theweekendprojects-landing-page`, which consumes the fork via `file:`), deploy, and confirm
   the new recipes appear under Add -> Section recipes and insert correctly.

## Done when

- The first-batch recipes are in `DAISY_RECIPES`, each inserts a correct, styled, editable section
  on a live EmVB page, and the per-recipe prop-key test passes.
- `daisy:test` and `typecheck` are green.
- No recipe depends on a capability the provider lacks (library images in provider fields, child
  nodes inside a provider node) — those are tracked separately in
  `DAISYUI-IMAGE-CAROUSEL-BUGS.md`.

## Related

- `DAISYUI-IMAGE-CAROUSEL-BUGS.md` — the image/carousel gaps; FEAT-1 (a media field kind for
  provider fields) would let image-bearing recipes use the library instead of URL placeholders.
- `DAISYUI-CONFORMANCE-AUDIT.md` — which components are verified vs experimental; prefer verified
  ones for the first recipe batch.
