# @perkyzz/emvb-daisyui

Generated daisyUI component provider for EmVB. Layouts store semantic component properties, never arbitrary Tailwind class strings. The provider maps those properties to allowlisted daisyUI classes and returns EmVB-compatible VNodes.

Load `@perkyzz/emvb-daisyui/styles.css` in both the EmVB editor canvas and the published Astro site to guarantee visual parity.

## Recipes, validation, and compatibility

WP10-WP12 add ten semantic page/section recipes, catalog-driven accessibility and property validation, and versioned layout migration plus compatibility reporting. Use the focused exports `./recipes`, `./validation`, and `./compatibility`. Detailed recovery and release instructions are in `docs/recovery/WP10-WP12-RECIPES-VALIDATION-COMPATIBILITY.md`.
