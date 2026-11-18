# Bundle B: WP25 categorized palette, WP26 icons, WP27 official inventory

## WP25

Provider descriptors now carry category, search keywords, stable order and support status. The Add palette renders separate daisyUI sections for Actions, Data input, Data display, Navigation, Feedback, Layout, Mockup and Effects instead of one generic provider group. Search includes category and keyword metadata; verified entries remain ordered before experimental entries.

## WP26

Provider descriptors carry editor-only icon IDs. EmVB resolves them through an allowlisted Phosphor registry and falls back to a generic provider icon. Icon IDs are not persisted in layout JSON and cannot inject arbitrary UI or classes.

## WP27

A pinned daisyUI 5.7.50 inventory tracks all 68 official components. The support report now counts official total, implemented, verified, experimental and missing components, with category and icon metadata for every official entry. Missing components remain explicit rather than silently omitted.

Run `bun run --cwd packages/emvb-daisyui conformance:report` to generate the machine-readable inventory report.

## Inventory result at this commit

- Official components: 68
- Implemented locally: 47
- Verified: 10
- Experimental: 37
- Missing: 21

Missing IDs: `aura`, `calendar`, `diff`, `fab`, `fieldset`, `filter`, `hover-3d`, `hover-gallery`, `kbd`, `label`, `link`, `loading`, `megamenu`, `window-mockup`, `otp`, `radial-progress`, `skeleton`, `text-rotate`, `theme-controller`, `toast`, `validator`.
