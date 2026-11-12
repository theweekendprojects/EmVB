# WP17-WP20 completion

- WP19: provider style entry detection is recursive and deduplicated; Cloudflare no longer imports daisyUI globally. `needsProviderStyles` controls a route-local `DaisyStyles` component.
- WP17: Menu, Tabs, Accordion, Table and Carousel expose typed child add/edit/reorder/delete controls. Legacy text migration remains available in the provider compound module.
- WP18: runtime uses native dialog `showModal()`/`close()`, restores focus, and implements Arrow Left/Right plus Home/End tab navigation. Preview state is removed before serialization.
- WP20: exact pins remain daisyUI 5.7.50 and Tailwind CSS 4.1.17. The compiled-selector gate remains mandatory, and a generated support report distinguishes the verified ten from experimental catalog entries.

Run `bun install`, `bun run check`, `bun run daisy:test`, `bun run providers:smoke`, the real CSS compile gate, and Cloudflare live editor/public tests before release.
