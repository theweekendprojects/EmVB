# daisyUI images and carousel: bugs and work items

**Goal:** an editor can build a 5-image carousel in the EmVB editor, with images chosen from the
EmDash media library, and the published page shows the same carousel.

**Status:** not started. Found 2026-11-14 on https://theweekendprojects.com/pages/daisyui-test while
trying to build that carousel. Nothing was saved or published during the investigation.

Order of work: BUG-1, then BUG-2, then FEAT-1, then FEAT-2. BUG-1 blocks the rest.

---

## BUG-1: slides added with "Add Slide" do not render and are not in Layers

**Repro (editor, prod or local):**
1. Open a page in the editor. In Add, under "daisyUI · Data display", click Carousel.
2. In the right panel, under Slides, click "+ Add Slide" five times. Slide 1 to Slide 5 appear in the list.
3. Look at the canvas and at the Layers tab.

**Expected:** five slides render in the canvas carousel, and the carousel has five children in Layers.

**Actual:**
- The canvas carousel still has only the 3 built-in text slides ("First slide", "Second slide",
  "Third slide"). The iframe DOM under the `.carousel` element has 3 `article.carousel-item`
  children and none from the added slides.
- The Carousel row in Layers has no expand caret and no children.

**What is known:**
- `ProviderCompoundEditor` (`packages/emvb/src/admin/editor/panels/settings/ProviderCompoundEditor.tsx`)
  stores each added slide as a child of the carousel node: `onChange({ ...node, children: next })`.
- The carousel `build()` (`packages/emvb-daisyui/src/catalog/interactive.ts`, `CAROUSEL`) renders its
  text `slides` field first, then `...children`.
- `isParentNode` in `packages/emvb/src/core/schema/layout.ts` does not include `"provider"`.
  Suspected cause, not confirmed: the tree walkers (editor, Layers, drop targets, possibly render)
  treat provider nodes as leaves, so their children are dropped or hidden.
- The compound editor config also covers Tabs, Accordion, Menu and Table
  (`COMPOUND_CONFIG` in `packages/emvb-daisyui/src/compound/editor.ts`). They likely have the same
  bug. Check each one.
- The panel hides the `slides` and `current` fields when slide editing is on
  (`compoundHidden` in `ElementPanel.tsx`, `daisyDescriptor()`), so the 3 default text slides cannot
  be removed from the panel.

**To do:**
- Add a failing test that builds a carousel node with N `carousel-item` children and asserts they
  render as N `.carousel-item` elements, in both the editor canvas path and the public render path.
- Find where provider children are dropped and fix it. Confirm `isParentNode` is the cause before
  changing it, since many code paths use it.
- When a carousel has `carousel-item` children, do not also render the default text `slides`.
  A new carousel should either start with no default text slides or migrate them to items. Keep
  existing saved layouts working: `migrateLegacyItems` in `compound/index.ts` reads `props.items`,
  not `props.slides`, so check which one carousel needs.
- Repeat the same repro for Tabs, Accordion, Menu and Table and fix what is broken.

**Done when:** the repro shows 5 slides in the canvas and 5 children in Layers, the published HTML
has 5 `.carousel-item` elements, and the new tests pass.

---

## BUG-2: child nodes cannot be added inside a provider node

The panel says slide content is "edited from this item's child nodes in Layers", and the daisyUI
audit lists this as the one real gap. Today a Layers row for a provider node cannot hold elements.

**To do:**
- Make provider nodes whose definition has `container: true` accept drops and show children in
  Layers, with the same drag, drop, move and delete behavior as a native Container.
- A `carousel-item` must be able to hold at least one native Image element.
- Validate drops with the existing rules (`validateCompoundTree`). A carousel should accept only
  `carousel-item` children.

**Done when:** in the editor you can drag a native Image from Add into a slide, move it, delete it,
undo and redo, and the saved layout round-trips.

---

## FEAT-1: media library picker for provider fields

Native EmVB Image uses a field of `kind: "media"` rendered by `MediaPicker`
(`packages/emvb/src/admin/editor/panels/settings/MediaPicker.tsx`): library, upload, or URL, and it
stores `src` and `mediaId`. The provider API has no such kind:
`ProviderFieldKind = "text" | "textarea" | "number" | "select" | "boolean" | "href"` in
`packages/emvb-provider-api/src/types.ts`. So daisyUI image fields are plain URL text boxes:
Hero image and Avatar take one "Image URL", Hover Gallery takes a textarea of URLs.

**To do:**
- Add `"media"` to `ProviderFieldKind` and to the field-kind checks in `emvb-provider-api`.
  Additive only, so existing providers keep working.
- Make `FieldControl` / `daisyDescriptor()` render `MediaPicker` for a provider field of kind
  `media`, writing `src` (and `mediaId` when present) the way the native Image does.
- Sanitize the value on render with the same helper the native Image uses (`sanitizeMediaUrl`).
- Switch the daisyUI Hero image and Avatar `src` fields to `media`.
- The provider-api `dist/` is not committed and goes stale. After changing provider-api, run
  `bun run providers:build` before building a consuming site.

**Done when:** selecting a daisyUI Hero or Avatar shows the same library / upload / URL picker as a
native Image, and the chosen image renders in the canvas and on the published page.

---

## FEAT-2: image carousel built on native Image

Depends on BUG-1, BUG-2 and ideally FEAT-1.

**To do:**
- Slides (`carousel-item`) hold child nodes, so a slide can contain a native Image. Rendering is
  `div.carousel-item > img`.
- Make the editor easy: a new Carousel starts with no text slides, or with slides that are empty
  containers with a visible "Drop an image here" placeholder.
- Keep the carousel accessible: `role="group"`, an `aria-label` like "1 of 5", and keyboard
  control through the existing runtime (`@perkyzz/emvb-daisyui/runtime`, `carousel` is in
  `needsRuntime`).
- Decide and document whether prev/next arrows and dots are in scope. The current markup has
  none, so arrows need new markup plus runtime support.

**Done when:** a 5-image carousel built in the editor publishes and scrolls on the live page, with
images chosen from the media library.

---

## Verification checklist (run in the EmVB repo)

- `bun run typecheck` is green.
- `bun run daisy:test` is green.
- New tests for BUG-1 and BUG-2 fail before the fix and pass after.
- Rebuild and live check on the consuming site (`theweekendprojects-landing-page`):
  `bun run providers:build` in EmVB, then `pnpm install && pnpm run build` and
  `pnpm exec wrangler deploy` in the landing page.
- Live check: the editor canvas shows the carousel with its images, and
  `https://theweekendprojects.com/pages/daisyui-test` has 5 `.carousel-item` elements after publish.
  `/pages/plain-test` must stay free of daisyUI components.

The EmVB check gate has about 46 known lint errors in the WP test files. They are separate from
this work.

## Related

- `docs/audits/DAISYUI-EDITABILITY-AUDIT.md`: section C and "The one real gap" describe the same
  compound-children limit.
- Editor canvas CSS (fixed separately): the canvas only loads stylesheets listed in
  `emvb({ canvasStyles })`. See "Host site setup" in `packages/emvb-daisyui/README.md`.
