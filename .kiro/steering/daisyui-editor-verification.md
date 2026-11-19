# daisyUI editor verification

How to check the daisyUI components in the real EmVB editor. Use this whenever a component, its
variants, or its placeholders change. Do not check components on existing pages: those pages
mix native EmVB elements, old content and stale props, so they say nothing reliable.

## Rules

1. Real editor only. Every check happens in the admin editor on prod
   (`/_emdash/admin/plugins/emvb/editor?entry=<id>`), after the landing site is deployed. Nothing
   is published without the user's explicit approval.
2. Fresh draft page for each check run. Never reuse a page that already has content.
3. Insert daisyUI components only from the Add panel's daisyUI groups. Match the tile inside the
   group whose heading starts with "daisyUI", never by name alone. Native EmVB elements share
   names (Button, Label, Link, Table, Card) and must not be picked.
4. Insert at the root. Select the page root before each insert, so every component is a direct
   child of the page. Inserting inside another element nests it and breaks the check.
5. Count before judging. After the build, the canvas must hold exactly the expected number of
   daisyUI nodes and no native nodes. Count with the component's own class (for example the
   root class `badge`, `btn`), not with `emvb-provider`, which is not on every element. If the
   count is wrong, stop and rebuild the page. Do not judge a broken page.
6. Look at the real editor. Save the draft, scroll the canvas in steps of about 800 px, and
   screenshot the whole editor viewport at each step (`tmp/daisy-shots/...`). Read the images
   back and describe what each component looks like.
7. Compare variants with daisyUI's official lists. The lists are the `Class names` section of
   `skills/daisyui/components/<name>.md` in github.com/saadeghi/daisyui. For each component,
   every official modifier must be selectable in the editor's settings panel, or be listed as a
   deliberate omission with a reason. Structural parts (card-body, modal-box, menu-title) are not
   variants.
8. Placeholders must read on the dark theme. A placeholder that looks like a hole, a broken
   image, or a blank box is a defect.
9. Record each result: component, variants checked, selectable or not, what the screenshot shows,
   and the fix. Fix in `packages/emvb-daisyui/src/catalog`, run the daisyUI test suite, deploy the
   landing page, and check again on a fresh page.

## Per-run checklist

- [ ] Landing deployed from the current EmVB working tree (`pnpm install --force && pnpm deploy`
      in the landing repo).
- [ ] Fresh draft page created (title and slug are new).
- [ ] Insertion done from daisyUI groups only, at the root.
- [ ] Canvas count matches the expected daisyUI count; no native nodes.
- [ ] Screenshots taken in scroll steps and read back.
- [ ] Variants compared with the daisyUI skill lists, with differences recorded.
- [ ] Results and fixes recorded; draft page deleted only with the user's approval.
