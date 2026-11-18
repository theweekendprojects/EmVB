import type { LegacyNodeUpgrade } from "@perkyzz/emvb-provider-api";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Upgrades a node stored as the daisyUI-specific `daisy` type (before daisyUI wrote generic
 * `provider` nodes). Its props keep their meaning; the theme moves from props into provider
 * metadata, as the provider now expects.
 */
export const upgradeLegacyDaisyNode: LegacyNodeUpgrade = (node) => {
  const props = isRecord(node["props"]) ? { ...node["props"] } : {};
  const theme = typeof props["theme"] === "string" ? props["theme"] : undefined;
  delete props["theme"];
  return {
    ...node,
    type: "provider",
    provider: "daisyui",
    providerVersion: 2,
    props,
    ...(theme ? { providerMeta: { theme } } : {}),
  };
};
