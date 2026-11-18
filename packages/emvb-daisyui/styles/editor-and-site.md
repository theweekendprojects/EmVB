# CSS parity contract

Compile `emvb-daisyui.css` once during the host build. Load the same compiled asset in:

1. the EmVB iframe canvas; and
2. the public Astro layout.

Apply `themeAttributes()` on the page root and optional section containers. Never compile CSS at request time and never accept arbitrary layout-provided Tailwind classes.
