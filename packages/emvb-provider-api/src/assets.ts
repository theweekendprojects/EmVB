import type { ComponentProvider, ProviderComponentNode } from "./types.ts";

export function layoutUsesProvider(nodes: readonly ProviderComponentNode[], providerId: string): boolean {
  return nodes.some((node) => (node.type === "provider" && (node as ProviderComponentNode & { provider?: string }).provider === providerId) || layoutUsesProvider(node.children ?? [], providerId));
}

export function providerStyleEntries(nodes: readonly ProviderComponentNode[], providers: readonly ComponentProvider[]): string[] {
  const entries = new Set<string>();
  for (const provider of providers) if (layoutUsesProvider(nodes, provider.id)) for (const css of provider.cssEntryPoints) entries.add(css);
  return [...entries];
}
