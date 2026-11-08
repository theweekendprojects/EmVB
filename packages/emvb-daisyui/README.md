# @perkyzz/emvb-daisyui

Generated daisyUI component provider for EmVB. Layouts store semantic component properties, never arbitrary Tailwind class strings. The provider maps those properties to allowlisted daisyUI classes and returns EmVB-compatible VNodes.

Load `@perkyzz/emvb-daisyui/styles.css` in both the EmVB editor canvas and the published Astro site to guarantee visual parity.

## Recipes, validation, and compatibility

WP10-WP12 add ten semantic page/section recipes, catalog-driven accessibility and property validation, and versioned layout migration plus compatibility reporting. Use the focused exports `./recipes`, `./validation`, and `./compatibility`. Detailed recovery and release instructions are in `docs/recovery/WP10-WP12-RECIPES-VALIDATION-COMPATIBILITY.md`.

## Conformance status

The provider currently contains a broad experimental catalog, but only the subset exported by `./conformance` is considered verified. The compatibility boundary is pinned to daisyUI 5.7.50 and Tailwind CSS 4.1.17. Components marked **experimental** in the EmVB palette must not be treated as production-supported until they pass compiled-selector, official-markup, axe-core, keyboard, editor/public parity, and visual-regression gates. See `docs/audits/DAISYUI-CONFORMANCE-AUDIT.md`.
