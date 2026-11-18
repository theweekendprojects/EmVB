# daisyUI editability audit

**Question:** "none of the daisyUI elements are text editable."
**Verdict:** text editing IS wired end to end and WORKS. Proven live on prod. The symptom you saw
was almost certainly **unpublished drafts** (edits show in the editor but the *published* page you
opened was stale) and/or compound items that edit through a different panel. There is **one real
gap** (compound rich bodies) and several usability traps, listed below.

Method: full source trace (core editor + provider-api + daisyui packages) plus a live edit→publish→
fetch test on `https://theweekendprojects.com/pages/daisyui-test`.

---

## Live proof (prod)
1. Selected the daisyUI Button in the editor; the right panel shows editable fields: **Label**,
   Color, Variant, Size, Disabled, Theme.
2. Changed Label "Button" → "Save changes". Canvas updated immediately.
3. Clicked **Publish**.
4. `curl` the public page → `<button class="emvb-provider btn btn-primary btn-md">Save changes`.

So: panel edit → `node.props.label` → canvas re-render → saved layout → published HTML. Confirmed.

---

## The pipeline (all wired, file:line)
- Panel descriptor for a provider node: `packages/emvb/src/admin/editor/panels/ElementPanel.tsx`
  `daisyDescriptor()` (~L304). Looks up the registered provider + component; returns its
  `descriptor.fields`.
- Field render + write-back: `ElementPanel.tsx` (~L595) maps fields through `FieldControl`; the
  write is `withProp(node,key,value)` in `settings/node-props.ts` (`{...node, props:{...props,[key]:value}}`).
  **No provider-specific branch drops the write** — providers are written exactly like native nodes.
- Descriptor/field generation: `packages/emvb-daisyui/src/generator/generate.ts` `generateComponent`
  emits `descriptor.fields` with the SAME `key` that `build()`/`textChildren`/`fieldAttrs` read back.
  Verified no panel-writes-X / build-reads-Y mismatch for button, badge, alert, card, stats, table.
- Field kinds: provider kinds (`text|textarea|number|select|boolean|href`) are all a subset of what
  the panel's `FieldControl` renders. No uneditable-kind gap.
- Render (one path, editor + public): `core/elements/index.ts` `providerElement.build` →
  daisyUI `render` → `generated.build` emits the prop text as a VNode child. Compound parts:
  `packages/emvb-daisyui/src/compound/index.ts` `renderCompoundNode` reads `props.label`.
- Verified vs experimental: `support` is metadata only; it does NOT gate editing. A verified Button
  and an experimental Timeline edit through the identical pipeline.

---

## Why it LOOKED uneditable (ranked)

### A. Drafts not published (most likely what you hit) — NOT a bug
Edits save as a **draft**. The editor top bar reads "Changes not published". The public page keeps
serving the last PUBLISHED layout until you click **Publish**. Opening the public URL after editing
(without publishing) shows the old text → looks like editing did nothing. Confirmed: the live page
only changed to "Save changes" after I pressed Publish.
- Usability fix to consider: make the unpublished state louder, or auto-explain on first edit.

### B. Provider not registered in a given runtime → EVERY daisy element shows "Unknown element"
If the daisyUI provider isn't registered in the editor runtime, `daisyDescriptor` returns
`undefined` and the panel renders "Unknown element … can be moved or deleted, but not edited" — no
fields at all, for every daisy component. Registration side-effect: `emvb-daisyui/src/provider.ts`
`registerDaisyUIProvider()`, pulled in via the host's `adminEntry` wrapper + `providers` option.
On the tested prod deploy it WAS registered (fields showed), so this wasn't the cause here — but it
is the failure that best matches a literal "none editable", so verify registration first on any
site that shows it.

### C. Compound items edit in a different panel (tabs / accordion / menu / carousel)
Their per-item text is NOT in the main field list (hidden by `compoundHidden` in `daisyDescriptor`);
it is edited in **`ProviderCompoundEditor`** (`settings/ProviderCompoundEditor.tsx`, writes each
child's `props.label`). If a user expects the item text in the top field list, it looks missing even
though it's editable lower in the panel. Usability trap, not a break.

---

## The one REAL gap
- **Compound rich bodies are not text-editable in the panel.** `carousel-item` content and
  `table-cell` rich content are child nodes edited "in Layers", not a text field
  (`ProviderCompoundEditor` explicitly says so). Table header/row TEXT is editable via the
  `headers`/`rows` string fields, but a cell's rich content is not inline-editable. This is by
  design today but is the thing most likely to read as "can't edit the text".

---

## Recommended follow-ups (for Copilot)
1. **Surface the publish state** so an edit isn't mistaken for a no-op (the #1 confusion). e.g. a
   persistent "Draft — publish to see it live" banner in the editor, and/or a preview link.
2. **Compound item text in the main panel:** either show a first-class "Items" editor section at the
   top of the panel (not only `ProviderCompoundEditor` lower down) or inline-edit item labels on the
   canvas.
3. **Inline canvas text editing** for simple components (click the button text, type) — today text
   is edited only via the side panel Label field; direct canvas editing would match user expectation.
4. **Registration guard:** if `daisyDescriptor` can't find the provider, show "daisyUI provider not
   registered" (actionable) instead of the generic "Unknown element".
5. Carousel/table-cell rich bodies: decide whether inline text is in scope; today it's child-node only.

---

## Bottom line
daisyUI element text **is** editable (Label/text field → publish → live), verified on prod. If it
looks like it isn't: (1) you didn't Publish, (2) the provider isn't registered on that deploy, or
(3) it's a compound item edited in the compound sub-panel. Only genuine gap: rich bodies of
carousel/table cells are child-node content, not a text field.
