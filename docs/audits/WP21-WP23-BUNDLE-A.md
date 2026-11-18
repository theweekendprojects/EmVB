# Bundle A: WP21 runtime wiring and WP23 generic conditional assets

## WP21

Interactive runtime is now declared by provider metadata and requested only for Modal, Tabs, Drawer, Dropdown, and Carousel. `RenderedPage` exposes `providerRuntimes` and `needsDaisyRuntime`; the Cloudflare host injects the runtime only on affected routes. Static daisyUI components load no runtime. The runtime preserves native dialog open/close, focus return, and keyboard tab navigation while transient state stays outside persisted layouts.

## WP23

Provider asset discovery is provider-neutral. `providerAssetEntries()` recursively scans provider nodes, deduplicates CSS/runtime entries, and returns exact public entry points. `RenderedPage` exposes `providerStyles` and `providerRuntimes`. The Cloudflare host conditionally loads `DaisyStyles` and `DaisyRuntime`; routes without provider nodes load neither, and static daisyUI routes load CSS without runtime.

## Gates

Run `bun install`, provider API tests, daisyUI tests, `bun run check`, `bun run providers:smoke`, Cloudflare production build, and route-level HTML assertions. Negative route: no provider nodes means no daisyUI stylesheet and no interactive script.
