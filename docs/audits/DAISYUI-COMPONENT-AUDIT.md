# daisyUI components: full audit in the EmVB editor

**Status:** audit complete, no fixes applied. **Date:** 2026-11-15.
**Scope:** all 68 daisyUI components in `packages/emvb-daisyui/src/catalog/`, as the editor offers them.
**Test page:** `daisyui-test` on the live site, edited in the EmVB editor. Every test was reverted; nothing was saved or published.

## Summary

| Result | Count | Meaning |
| --- | --- | --- |
| BROKEN | 11 | Not on the editor canvas, or removed on the public page |
| PARTIAL | 37 | Renders, but has a gap: children, styling, empty by default, or a broken image |
| OK | 20 | No gap found in these checks |

- Settings panel: 68/68 open with the right fields. None shows "Unknown element".
- Editor canvas: 66/68 render. Not rendered: `modal`, `kbd`.
- Nesting: 20 daisyUI containers. Native EmVB containers accept children in the editor; a daisyUI container does not, so it cannot hold a Button or any other child. 19 were tested directly. `modal` could not be tested because it renders nothing.
- Public page: 11 components are refused by the output allowlist and removed. 4 were checked on the public renderer; 7 follow the same rule.
- CSS: 195 of 405 options (24 components) use a class that is missing from the compiled stylesheet.

## Root causes

**1. Daisy containers are not parents (20 components).** A daisyUI provider node is not treated as a parent by the editor's tree, and its children are not rendered on the public page. Editor check: select a card, hero, navbar, footer, accordion, or any other container, add a Button, and it lands next to the container. The same test with EmVB's native Container puts the Button inside. So native containers accept children in the editor, and the limit is specific to daisyUI.
Public check: the card and hero were rendered through the public renderer with a Button child. The child was not in the output.
This blocks every multi-part daisyUI layout: a card with actions, a hero with calls to action, a navbar with links. The Pricing, Login, Signup and Contact recipes depend on nested children, so they lose those children on the public page.
Pre-existing: the same limit is written up in `DAISYUI-IMAGE-CAROUSEL-BUGS.md` (BUG-2) and was present before the 1.2.0 merge.

**2. Output allowlist refuses some tags and attributes.** The public renderer only emits a fixed set of HTML tags and attributes. Refused components disappear on the public page. `rows`, `selected`, `accept`, `inputmode`, `popovertarget`, `style`, and the `dialog`, `table`, `pre` and `kbd` tags are not in the list. The allowlist is the same as before the merge.

**3. Classes missing from the compiled CSS (195 options).** Tailwind only generates classes it finds written out in the source. Literal class names such as `btn-primary` and `btn-outline` are generated. Classes built from a template, such as `btn-${tone}`, are not. The safelist file lists many of them, but they are still not generated in the deployed stylesheet. The class names exist in the official daisyUI 5.7.50 package, so the fault is in our build.
Verified: `btn-accent` is in `generated/safelist.css` and in daisyUI 5.7.50, and absent from the live `/styles/emvb-daisyui.css`.

**4. Default images point at files that do not exist.** Requests for `/avatar.png`, `/image.jpg`, `/image-1.jpg` and `/image-2.jpg` return 404 in the editor console. These are the catalog defaults for Avatar (`/avatar.png`), Mask (`/image.jpg`) and Hover Gallery (`/image-1.jpg`, `/image-2.jpg`).

## Full table

Columns: **Canvas** = element on the editor canvas after adding. **Fields** = settings inputs in the panel. **Children** = can a Button be placed inside (containers only). **Public** = result on the public renderer. **CSS** = options that use a class missing from the stylesheet.

| Component | Category | Canvas | Fields | Children | Public | CSS | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Button (`button`) | Actions | yes (1 node, 40px) | 7 | n/a | renders | 8: neutral, accent, info, warning, ... | **PARTIAL** | 8 option(s) use a class missing from the CSS |
| Badge (`badge`) | Data display | yes (1 node, 24px) | 5 | n/a | renders | 1: info | **PARTIAL** | 1 option(s) use a class missing from the CSS |
| Alert (`alert`) | Feedback | yes (1 node, 46px) | 5 | n/a | renders | 0 | **OK** | - |
| Card (`card`) | Layout | yes (4 nodes, 106px) | 6 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor |
| Progress (`progress`) | Data display | yes (1 node, 8px) | 7 | n/a | renders | 7: neutral, secondary, accent, info, ... | **PARTIAL** | 7 option(s) use a class missing from the CSS |
| Statistic (`stats`) | Data display | yes (5 nodes, 116px) | 6 | n/a | renders | 0 | **OK** | - |
| Input (`input`) | Actions | yes (1 node, 40px) | 12 | n/a | renders | 11: xs, sm, md, xl, ... | **PARTIAL** | 11 option(s) use a class missing from the CSS |
| Textarea (`textarea`) | Actions | yes (1 node, 80px) | 12 | n/a | removed (attribute "rows", verified) | 14: xs, sm, md, lg, ... | **BROKEN** | Public: attribute "rows" refused; 14 option(s) use a class missing from the CSS |
| Select (`select`) | Actions | yes (4 nodes, 40px) | 11 | n/a | removed (attribute "selected", verified) | 14: xs, sm, md, lg, ... | **BROKEN** | Public: attribute "selected" refused; 14 option(s) use a class missing from the CSS |
| Checkbox (`checkbox`) | Actions | yes (1 node, 24px) | 9 | n/a | renders | 13: xs, sm, md, lg, ... | **PARTIAL** | 13 option(s) use a class missing from the CSS |
| Radio (`radio`) | Actions | yes (1 node, 24px) | 9 | n/a | renders | 13: xs, sm, md, lg, ... | **PARTIAL** | 13 option(s) use a class missing from the CSS |
| Toggle (`toggle`) | Actions | yes (1 node, 24px) | 9 | n/a | renders | 13: xs, sm, md, lg, ... | **PARTIAL** | 13 option(s) use a class missing from the CSS |
| File-Input (`file-input`) | Actions | yes (1 node, 40px) | 9 | n/a | removed (attribute "accept", rule) | 13: xs, sm, md, lg, ... | **BROKEN** | Public: attribute "accept" refused; 13 option(s) use a class missing from the CSS |
| Range (`range`) | Actions | yes (1 node, 24px) | 10 | n/a | renders | 13: xs, sm, md, lg, ... | **PARTIAL** | 13 option(s) use a class missing from the CSS |
| Rating (`rating`) | Actions | yes (6 nodes, 24px) | 7 | n/a | renders | 5: xs, sm, md, lg, ... | **PARTIAL** | 5 option(s) use a class missing from the CSS |
| Navbar (`navbar`) | Navigation | yes (12 nodes, 65px) | 7 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor |
| Menu (`menu`) | Navigation | yes (5 nodes, 82px) | 5 | n/a | renders | 5: xs, sm, md, lg, ... | **PARTIAL** | 5 option(s) use a class missing from the CSS |
| Breadcrumbs (`breadcrumbs`) | Navigation | yes (7 nodes, 40px) | 4 | n/a | renders | 0 | **OK** | - |
| Pagination (`pagination`) | Navigation | yes (6 nodes, 40px) | 7 | n/a | renders | 5: xs, sm, md, lg, ... | **PARTIAL** | 5 option(s) use a class missing from the CSS |
| Steps (`steps`) | Navigation | yes (5 nodes, 64px) | 5 | n/a | renders | 0 | **OK** | - |
| Dock (`dock`) | Navigation | yes (7 nodes, 64px) | 6 | n/a | renders | 0 | **OK** | - |
| Footer (`footer`) | Navigation | yes (8 nodes, 76px) | 6 | NO: Button lands beside it | renders | 1: horizontal | **PARTIAL** | Cannot hold children in the editor; 1 option(s) use a class missing from the CSS |
| Tabs (`tabs`) | Navigation | yes (7 nodes, 126px) | 4 | n/a | renders | 0 | **OK** | - |
| Accordion (`accordion`) | Layout | yes (7 nodes, 151px) | 4 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor |
| Dropdown (`dropdown`) | Navigation | yes (9 nodes, 48px) | 6 | n/a | renders | 0 | **OK** | - |
| Modal (`modal`) | Feedback | NO element | 7 | not testable (no element) | removed (tag "dialog", rule) | 0 | **BROKEN** | Public: tag "dialog" refused; No element on the editor canvas |
| Drawer (`drawer`) | Layout | yes (7 nodes, 40px) | 6 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor |
| Carousel (`carousel`) | Layout | yes (19 nodes, 256px) | 4 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor |
| Collapse (`collapse`) | Layout | yes (3 nodes, 58px) | 6 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor |
| Swap (`swap`) | Actions | yes (4 nodes, 24px) | 7 | n/a | renders | 0 | **OK** | - |
| Table (`table`) | Data display | yes (1 node, 0px) | 5 | n/a | removed (tag "table", verified) | 0 | **BROKEN** | Public: tag "table" refused; No rows by default: an empty table wrapper |
| Timeline (`timeline`) | Data display | yes (14 nodes, 124px) | 5 | n/a | renders | 0 | **OK** | - |
| Avatar (`avatar`) | Data display | yes (3 nodes, 64px) | 7 | n/a | renders | 0 | **PARTIAL** | Default image /avatar.png (404) |
| Chat Bubble (`chat-bubble`) | Data display | yes (4 nodes, 65px) | 7 | n/a | renders | 0 | **OK** | - |
| List (`list`) | Data display | yes (11 nodes, 138px) | 5 | n/a | renders | 0 | **OK** | - |
| Status (`status`) | Data display | yes (1 node, 8px) | 6 | n/a | renders | 0 | **OK** | - |
| Tooltip (`tooltip`) | Data display | yes (1 node, 24px) | 6 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor |
| Countdown (`countdown`) | Data display | yes (2 nodes, 30px) | 7 | n/a | removed (attribute "style", rule) | 0 | **BROKEN** | Public: attribute "style" refused |
| Hero (`hero`) | Marketing | yes (6 nodes, 384px) | 8 | NO: Button lands beside it | renders | 1: lg | **PARTIAL** | Cannot hold children in the editor; 1 option(s) use a class missing from the CSS |
| Stack (`stack`) | Layout | yes (7 nodes, 76px) | 5 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor |
| Divider (`divider`) | Layout | yes (1 node, 56px) | 5 | n/a | renders | 0 | **OK** | - |
| Join (`join`) | Layout | yes (1 node, 0px) | 4 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor; No children by default, so it is empty |
| Indicator (`indicator`) | Layout | yes (2 nodes, 0px) | 5 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor; Zero height by default; the badge is clipped at the edge (static render) |
| Mask (`mask`) | Layout | yes (1 node, 0px) | 6 | n/a | renders | 0 | **PARTIAL** | Default image /image.jpg (404) |
| Browser Mockup (`browser-mockup`) | Marketing | yes (4 nodes, 302px) | 4 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor |
| Phone Mockup (`phone-mockup`) | Marketing | yes (4 nodes, 978px) | 4 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor |
| Code Mockup (`code-mockup`) | Marketing | yes (1 node, 68px) | 5 | n/a | removed (tag "pre", rule) | 0 | **BROKEN** | Public: tag "pre" refused |
| Loading (`loading`) | Feedback | yes (1 node, 24px) | 5 | n/a | renders | 9: spinner, ring, ball, bars, ... | **PARTIAL** | 9 option(s) use a class missing from the CSS |
| Skeleton (`skeleton`) | Feedback | yes (1 node, 0px) | 4 | n/a | renders | 0 | **PARTIAL** | Zero height by default, so nothing shows |
| Radial progress (`radial-progress`) | Feedback | yes (1 node, 80px) | 5 | n/a | removed (attribute "style", rule) | 8: neutral, primary, secondary, accent, ... | **BROKEN** | Public: attribute "style" refused; 8 option(s) use a class missing from the CSS |
| Toast (`toast`) | Feedback | yes (2 nodes, 46px) | 5 | NO: Button lands beside it | renders | 6: start, center, end, top, ... | **PARTIAL** | Cannot hold children in the editor; 6 option(s) use a class missing from the CSS |
| Label (`label`) | Actions | yes (1 node, 24px) | 4 | n/a | renders | 0 | **OK** | - |
| Fieldset (`fieldset`) | Actions | yes (2 nodes, 38px) | 3 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor |
| Kbd (`kbd`) | Data display | NO element | 4 | n/a | removed (tag "kbd", verified) | 5: xs, sm, md, lg, ... | **BROKEN** | Public: tag "kbd" refused; No element on the editor canvas; 5 option(s) use a class missing from the CSS |
| Link (`link`) | Navigation | yes (1 node, 24px) | 6 | n/a | renders | 8: neutral, primary, secondary, accent, ... | **PARTIAL** | 8 option(s) use a class missing from the CSS |
| Window mockup (`window-mockup`) | Layout | yes (1 node, 48px) | 3 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor |
| Theme Controller (`theme-controller`) | Actions | yes (1 node, 13px) | 4 | n/a | renders | 0 | **OK** | - |
| Validator (`validator`) | Actions | yes (3 nodes, 80px) | 6 | n/a | renders | 0 | **OK** | - |
| Diff (`diff`) | Data display | yes (4 nodes, 29px) | 4 | n/a | renders | 0 | **PARTIAL** | Before and After labels overlap (static render; confirm in editor) |
| Filter (`filter`) | Actions | yes (4 nodes, 40px) | 4 | n/a | renders | 0 | **OK** | - |
| Aura (`aura`) | Layout | yes (1 node, 4px) | 4 | NO: Button lands beside it | renders | 4: xs, sm, md, xl | **PARTIAL** | Cannot hold children in the editor; 4 option(s) use a class missing from the CSS; 4px tall by default, barely visible |
| Calendar (`calendar`) | Actions | yes (1 node, 40px) | 6 | n/a | renders | 0 | **OK** | - |
| FAB / Speed Dial (`fab`) | Actions | yes (5 nodes, 216px) | 6 | n/a | renders | 0 | **OK** | - |
| Hover 3D Card (`hover-3d`) | Layout | yes (9 nodes, 0px) | 3 | NO: Button lands beside it | renders | 0 | **PARTIAL** | Cannot hold children in the editor; No children by default, so it is empty |
| Hover Gallery (`hover-gallery`) | Data display | yes (3 nodes, 0px) | 4 | n/a | renders | 0 | **PARTIAL** | Default image /image-1.jpg, /image-2.jpg (404) |
| Megamenu (`megamenu`) | Navigation | yes (22 nodes, 115px) | 6 | n/a | removed (attribute "popovertarget", rule) | 5: xs, sm, md, lg, ... | **BROKEN** | Public: attribute "popovertarget" refused; 5 option(s) use a class missing from the CSS |
| OTP (`otp`) | Actions | yes (8 nodes, 40px) | 7 | n/a | removed (attribute "inputmode", rule) | 13: xs, sm, md, lg, ... | **BROKEN** | Public: attribute "inputmode" refused; 13 option(s) use a class missing from the CSS |
| Text Rotate (`text-rotate`) | Data display | yes (5 nodes, 24px) | 4 | n/a | renders | 0 | **OK** | - |

## Not verified

These need a visual check in the editor, not a static render:
- `fab`: 216px tall by default. Whether it floats in the corner is not confirmed.
- `toast`: it renders in the normal flow in the editor. Whether its fixed positioning applies there is not confirmed.
- `dock`, `megamenu`, `mockup` components: rendered, but their look was only checked in the default state.
- Interactive behavior of `modal`, `drawer`, `dropdown`, `collapse`, `swap`, `tabs`, `accordion` and `carousel` (open, close, next slide) was not tested.
- The 7 components marked `rule` were not rendered on a live page.

## How this was produced

1. **Editor:** on `daisyui-test`, each daisyUI tile was clicked on a clean page. The new DOM node was identified against the canvas before the click. Fields were counted in the content tab. The page was reverted after each test.
2. **Nesting:** each daisyUI container was added, selected by clicking its canvas element, then a Button was added. The control used the native Container.
3. **Public renderer:** each component's default layout was rendered with the public renderer, and the output was checked for the refused tags and attributes.
4. **CSS:** every option in every `classMap` was checked against the stylesheet served at `/styles/emvb-daisyui.css`.

## Fix order

1. **Let daisy containers hold children.** Without this, no multi-part daisyUI component can be built in the editor. This also repairs the existing recipes.
2. **Make `modal` and `kbd` render**, then add the refused tags and attributes to the allowlist, or change the markup that uses them.
3. **Make the CSS complete.** Generate every option class at build time (for example, list the full class set as literal strings in the source) and rebuild the stylesheet.
4. **Replace the 404 default images** with bundled placeholders.
5. **Fix empty-by-default components** (table rows, zero-height skeleton, indicator, join, hover-3d).
6. **Check the visual items** in the "Not verified" list in the editor.

Each step needs a regression test. Step 1 can use a test like the one added for the render strip fix in `contract.test.ts`.

## Progress after step 1 and step 2

**Step 1, containers hold children (done, `d49a4442`).** A provider component declares `container: true`; the editor and the public renderer treat it as a parent. Verified live: a Button added after a Card lands inside it.

**Selection bug (done, `fd05eefd`).** Provider roots now keep their editor id, so a click on the canvas selects the element. Verified live.

**Step 2 (done, `58c43d14` and `716aacf8`).**
- Output allowlist: table family, `caption`, `kbd`, `pre`, `dialog`, `rows`, `selected`, `accept`, `inputmode`, `scope`, `popover` and `popovertarget` are allowed. The last two are checked against value rules. `style` stays refused by name (W-091).
- Option classes: every catalog class is written as a literal string, so Tailwind generates it. Dead options went from 195 to 7 on the live stylesheet. Of those 7, 2 are false positives (escaped names that are present) and 5 were pagination's `join-*` sizes, which do not exist in daisyUI 5.7.50. Pagination now puts its size on each button as `btn-*`.
- Images: avatar, mask and hover gallery default to no picture and show a daisyUI placeholder instead of requesting missing files.
- Guard: every daisyUI component's default markup passes the output serializer, except `countdown` and `radial-progress`.

**Still open**
- `countdown` and `radial-progress` set an inline `style`, which is refused by name (W-091). Decision needed: allow narrow custom-property styles, which reverses W-091, or generate per-value classes.
- Empty by default: `table` (no rows), `skeleton` (zero height), `join` and `hover-3d` (no children), `indicator` (zero height).
- `modal` and `kbd` were not on the editor canvas. They are now allowed by the serializer, but the canvas was not re-checked.
- The public output for the components allowed in step 2 is checked by unit tests, not on a published page.
