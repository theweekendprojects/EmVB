import type { ComponentProvider, ProviderComponentNode } from "./types.ts";

// The registry is heterogeneous: each provider is specialized to its own node subtype
// (e.g. daisyUI -> DaisyComponentNode). ComponentProvider is contravariant in its node type
// (its methods consume N), so a specialized provider is not assignable to the base. `any` here
// is the honest shape of "any provider, keyed by id"; each provider only ever receives its own
// nodes at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponentProvider = ComponentProvider<any>;

const providers = new Map<string, AnyComponentProvider>();

export function registerComponentProvider(provider: AnyComponentProvider): () => void {
  if (!/^[a-z][a-z0-9-]*$/.test(provider.id)) throw new Error(`Invalid provider id: ${provider.id}`);
  const current = providers.get(provider.id);
  if (current && current !== provider) throw new Error(`Component provider already registered: ${provider.id}`);
  providers.set(provider.id, provider);
  return () => { if (providers.get(provider.id) === provider) providers.delete(provider.id); };
}

export const componentProvider = (id: string): ComponentProvider<ProviderComponentNode> | undefined =>
  providers.get(id) as ComponentProvider<ProviderComponentNode> | undefined;
export const componentProviders = (): readonly ComponentProvider<ProviderComponentNode>[] =>
  [...providers.values()] as ComponentProvider<ProviderComponentNode>[];
export const clearComponentProvidersForTest = (): void => providers.clear();
