import { legacyNodeUpgrades } from "@perkyzz/emvb-provider-api";
import { isRecord } from "../record.ts";

/**
 * Upgrades stored nodes whose type a registered provider declares legacy (its `legacyNodeTypes`).
 * Core asks the registry and names no provider. A legacy type with no registered provider is left
 * as it is, so stored content is never dropped: it stays unknown until its provider is registered.
 */
export function upgradeLegacyNodes(doc: Record<string, unknown>): Record<string, unknown> {
  const upgrades = legacyNodeUpgrades();
  if (upgrades.size === 0 || !isRecord(doc["root"])) return doc;
  const walk = (node: Record<string, unknown>): Record<string, unknown> => {
    const type = node["type"];
    const upgrade = typeof type === "string" ? upgrades.get(type) : undefined;
    const current = upgrade ? upgrade(node) : node;
    const children = current["children"];
    if (!Array.isArray(children)) return current;
    return {
      ...current,
      children: children.map((child) => (isRecord(child) ? walk(child) : child)),
    };
  };
  return { ...doc, root: walk(doc["root"]) };
}
