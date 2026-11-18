import { afterAll, describe, expect, test } from "bun:test";
import { registerComponentProvider, type ComponentProvider } from "@perkyzz/emvb-provider-api";
import { validateLayout } from "../validate.ts";

// A fixture provider that stored one node type before it wrote generic `provider` nodes.
const PROVIDER = "legacy-kit";
const kit: ComponentProvider = {
  id: PROVIDER,
  label: "Legacy kit",
  nodeType: "provider",
  components: new Map(),
  legacyNodeTypes: {
    "old-kit": (node) => ({
      ...node,
      type: "provider",
      provider: PROVIDER,
      providerVersion: 2,
      props: { ...(node["props"] as Record<string, unknown>), upgraded: true },
    }),
  },
  createNode(component, id) {
    return { id, type: "provider", provider: PROVIDER, component, props: {} };
  },
  render() {
    return { tag: "div", attrs: {}, children: [] };
  },
  cssEntryPoints: [],
};
const dispose = registerComponentProvider(kit);
afterAll(() => dispose());

const storedNode = (id: string, children: unknown[] = []) => ({
  id,
  type: "old-kit",
  component: "card",
  props: { title: id },
  children,
});

const pageWith = (...children: unknown[]) => ({
  schemaVersion: 18,
  root: { id: "root0001", type: "container", props: {}, children },
});

describe("stored nodes of a provider's legacy type", () => {
  test("the provider upgrades them when the layout loads, children included", () => {
    const checked = validateLayout(pageWith(storedNode("old0001", [storedNode("old0002")])));
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    const [outer] = checked.layout.root.children ?? [];
    expect(outer).toMatchObject({
      type: "provider",
      provider: PROVIDER,
      providerVersion: 2,
      props: { title: "old0001", upgraded: true },
    });
    const inner = outer && "children" in outer ? outer.children?.[0] : undefined;
    expect(inner).toMatchObject({
      type: "provider",
      provider: PROVIDER,
      props: { title: "old0002", upgraded: true },
    });
  });

  test("a legacy type with no registered provider is kept as it is, never dropped", () => {
    const checked = validateLayout(pageWith({ id: "gone0001", type: "retired-kit", props: {} }));
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    expect(checked.layout.root.children?.[0]).toMatchObject({
      id: "gone0001",
      type: "retired-kit",
    });
  });
});
