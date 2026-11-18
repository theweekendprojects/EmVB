# WP15-WP16 theme activation and verified component editing

## WP15

- A registered daisyUI provider now declares page-root attributes through the neutral provider contract.
- EmVB applies `data-theme="light"` only when the rendered layout contains a daisyUI provider node.
- Component overrides stay in `providerMeta.theme` and render on that component root.
- The editor theme control reads and writes `providerMeta`, not semantic component props.
- Enabled overrides are Light, Dark, Corporate, Business, and Cupcake.

This follows official daisyUI v5 behavior: a default theme is configured in the plugin and `data-theme` can be placed on any element for nested overrides.

## WP16

- Provider descriptors are resolved by the persisted provider ID, fixing the generic node-type lookup that prevented fields from appearing.
- The verified ten expose only EmVB-supported field kinds: text, textarea, number, select, boolean, and href.
- Button tone, variant, and size remain fixed enum options. User text never enters class strings.
- Tests assert every verified component has editable fields, defaults, and renderer-consumed props.

## Remaining live gate

Run `bun run check`, deploy the Cloudflare consumer, edit every field of all verified components, save/reload, publish, and inspect computed styles. Button should publish with `data-theme="light"` on the page root and classes such as `btn btn-primary btn-md` with visible theme colors.
