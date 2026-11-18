# DCP-6: Final active-core decoupling

## Baselines reviewed

- Upstream main snapshot: `4f6589e6041df0a1d25ace783faff08c71d4285c`.
- Provider branch after DCP-5: `ae7653baae988446f7fe7fcba5f57994abf8febd`.

## Critical findings

DCP-5 already contains the neutral `ProviderCollectionDefinition`, DaisyUI-owned collection factories and the wired `ProviderCollectionEditor`. The separate `ProviderCompoundEditor.tsx` is unused dead code. Adding a second `compound()` API would duplicate the real architecture and is not part of DCP-6.

## Delivered

- Delete the unused DaisyUI-specific `ProviderCompoundEditor`.
- Remove `needsDaisyRuntime` from the EmVB render result.
- Keep `providerRuntimes` as the only core runtime requirement output.
- Resolve the statically imported DaisyUI Astro runtime in the Node and Cloudflare demo hosts.
- Add source-boundary regression tests.

## Compatibility retained

No provider API, schema, stored-node, migration, alias, generated-asset or lockfile change is introduced.

## Verification

Strict TypeScript compilation of the provider API and DaisyUI provider production files passed. Bun production transpilation of EmVB rendering and the DaisyUI provider passed. `git diff --check`, boundary checks, compatibility retention and lockfile equality passed. Full dependency installation and Astro/workspace checks remain blocked by HTTP 404 responses from the configured Microsoft package feed proxy and must run in normal CI.
