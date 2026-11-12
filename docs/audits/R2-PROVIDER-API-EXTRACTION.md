# R2 provider API extraction

## Delivered boundary

R2 introduces `@perkyzz/emvb-provider-api`, a framework-neutral workspace package containing provider nodes, VNodes, descriptors, recipes, validation issues, provider contracts, and a process-local registry. It has no dependency on EmVB, React, Astro, daisyUI, Tailwind CSS, or a provider implementation.

`@perkyzz/emvb-daisyui` now depends on the neutral API instead of depending on or peering with `@perkyzz/emvb`. Its existing public types remain source compatible through narrowed aliases and interfaces. The provider exposes `registerDaisyUIProvider()` and registers its singleton when its provider module is imported, preserving existing editor behavior during the transition.

EmVB core rendering no longer imports `@perkyzz/emvb-daisyui`. It resolves the `daisyui` provider through `componentProvider("daisyui")`. If the provider is unavailable, the existing safe unknown-component placeholder is rendered.

## Transitional coupling still present

The EmVB admin/editor package still imports daisyUI for its specialized palette, generated settings, recipes, and validation integration. Therefore R2 removes the **core renderer cycle** and the daisyUI-to-EmVB dependency, but does not yet remove every admin-time daisyUI import or the EmVB package dependency on daisyUI. That final separation requires a generic provider-aware Add panel, settings panel, recipe insertion path, and host bootstrap. It is tracked as R2.1 rather than hidden by an unsafe dynamic import.

## Registry behavior

- Provider IDs must match `^[a-z][a-z0-9-]*$`.
- Re-registering the same singleton is idempotent.
- Registering a different provider with an occupied ID fails.
- Registration returns an unregister callback.
- Tests can clear the process-local registry explicitly.

## Verification

```bash
bun test packages/emvb-provider-api/src
cd packages/emvb-daisyui && bun test src
bun build packages/emvb-provider-api/src/index.ts packages/emvb-daisyui/src/index.ts --outdir /tmp/r2-build --target browser
git diff --check
git fsck --full
```

## Next change, R2.1

1. Make AddPanel enumerate `componentProviders()` instead of importing daisyUI.
2. Make ElementPanel resolve generic provider descriptors.
3. Move recipe insertion and validation to provider registry contracts.
4. Add explicit host bootstrap in Node, Cloudflare, Astro, and site entry points.
5. Remove `@perkyzz/emvb-daisyui` from `packages/emvb/package.json`.
6. Add a no-provider editor fixture and a two-provider fixture.

Only after R2.1 should R3 introduce schema 18 and migrate `type: "daisy"` to the generic provider node.
