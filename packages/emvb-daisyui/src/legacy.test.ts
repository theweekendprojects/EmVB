import { describe, expect, test } from "bun:test";
import { upgradeLegacyDaisyNode } from "./legacy.ts";
import { daisyUIProvider } from "./provider.ts";

describe("the daisyUI legacy node type", () => {
  test("daisyUI declares the daisy node type as its own legacy type", () => {
    expect(Object.keys(daisyUIProvider.legacyNodeTypes ?? {})).toEqual(["daisy"]);
    expect(daisyUIProvider.nodeType).toBe("provider");
  });

  test("a daisy node becomes a daisyUI provider node, its props kept", () => {
    const upgraded = upgradeLegacyDaisyNode({
      id: "btn00001",
      type: "daisy",
      component: "button",
      props: { label: "Save", tone: "primary" },
    });
    expect(upgraded).toEqual({
      id: "btn00001",
      type: "provider",
      provider: "daisyui",
      component: "button",
      providerVersion: 2,
      props: { label: "Save", tone: "primary" },
    });
  });

  test("the theme moves from props into the node's provider metadata", () => {
    const upgraded = upgradeLegacyDaisyNode({
      id: "card0001",
      type: "daisy",
      component: "card",
      props: { title: "Plans", theme: "corporate" },
    });
    expect(upgraded["props"]).toEqual({ title: "Plans" });
    expect(upgraded["providerMeta"]).toEqual({ theme: "corporate" });
  });

  test("the input node is not changed", () => {
    const node = { id: "x0000001", type: "daisy", component: "card", props: { theme: "dark" } };
    upgradeLegacyDaisyNode(node);
    expect(node).toEqual({
      id: "x0000001",
      type: "daisy",
      component: "card",
      props: { theme: "dark" },
    });
  });
});
