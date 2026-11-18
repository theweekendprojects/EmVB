import { describe, expect, test } from "bun:test";
import { legacyNodeUpgrades, registerComponentProvider } from "./registry.ts";
import type { ComponentProvider } from "./types.ts";

const provider = (id: string, legacyNodeTypes?: ComponentProvider["legacyNodeTypes"]) =>
  ({
    id,
    label: id,
    nodeType: "provider",
    components: new Map(),
    legacyNodeTypes,
    createNode: (component: string, nodeId: string) => ({
      id: nodeId,
      type: "provider",
      provider: id,
      component,
      props: {},
    }),
    render: () => ({ tag: "div", attrs: {}, children: [] }),
    cssEntryPoints: [],
  }) as unknown as ComponentProvider;

describe("legacy node types", () => {
  test("a registered provider's legacy types are offered for upgrade, and removed with it", () => {
    const upgrade = (node: Record<string, unknown>) => node;
    const dispose = registerComponentProvider(provider("reg-legacy-a", { "reg-old-a": upgrade }));
    expect(legacyNodeUpgrades().get("reg-old-a")).toBe(upgrade);
    dispose();
    expect(legacyNodeUpgrades().has("reg-old-a")).toBe(false);
  });

  test("two providers cannot claim the same legacy type", () => {
    const upgrade = (node: Record<string, unknown>) => node;
    const first = registerComponentProvider(provider("reg-legacy-b", { "reg-old-b": upgrade }));
    expect(() =>
      registerComponentProvider(provider("reg-legacy-c", { "reg-old-b": upgrade })),
    ).toThrow("already claimed by reg-legacy-b");
    first();
  });

  test("no provider may claim the generic provider node type", () => {
    expect(() =>
      registerComponentProvider(provider("reg-legacy-d", { provider: (node) => node })),
    ).toThrow("cannot claim the provider node type");
  });
});
