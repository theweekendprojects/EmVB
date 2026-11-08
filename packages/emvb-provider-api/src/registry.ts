import type { ComponentProvider } from "./types.ts";

const providers = new Map<string, ComponentProvider>();

export function registerComponentProvider(provider: ComponentProvider): () => void {
  if (!/^[a-z][a-z0-9-]*$/.test(provider.id)) throw new Error(`Invalid provider id: ${provider.id}`);
  const current = providers.get(provider.id);
  if (current && current !== provider) throw new Error(`Component provider already registered: ${provider.id}`);
  providers.set(provider.id, provider);
  return () => { if (providers.get(provider.id) === provider) providers.delete(provider.id); };
}

export const componentProvider = (id: string): ComponentProvider | undefined => providers.get(id);
export const componentProviders = (): readonly ComponentProvider[] => [...providers.values()];
export const clearComponentProvidersForTest = (): void => providers.clear();
