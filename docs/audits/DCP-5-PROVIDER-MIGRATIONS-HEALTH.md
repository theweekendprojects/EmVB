# DCP-5: Provider migrations and health

## Delivered

- Provider-owned, pure node migration hook.
- Immutable recursive migration helper with version stamping.
- Downgrade, missing-migration and identity-change protection.
- Determinism fixtures.
- Provider health inventory for version, API, node schema, components, recipes, assets, runtime and node usage.
- Concrete DaisyUI imports removed from EmVB core tests; generic provider contract tests own the host behavior.

## Safety boundary

EmVB orchestrates migrations but never contains a toolkit-specific migration. Providers own their schema transitions and must preserve node identities. Missing providers remain stored and are reported by DCP-4 diagnostics.
