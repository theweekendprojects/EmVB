import { describe, expect, test } from "bun:test";
import { createDaisyUIProvider } from "../render/provider.ts";
import { DAISY_COMPONENT_CATALOG } from "../catalog/index.ts";

describe("WP15 default and component theme activation", () => {
  test("the page root inherits the document theme unless a node chose one", () => {
    const provider = createDaisyUIProvider(DAISY_COMPONENT_CATALOG);
    // No node asked for a theme, so the EmVB region inherits the host's light/dark choice
    // (forcing data-theme="light" painted daisyUI's white base over a dark host — fixed).
    expect(provider.rootAttributes?.([], { mode: "public" })).toEqual({});
    const themed = provider.createNode("button", "button-theme");
    themed.providerMeta = { theme: "corporate" };
    expect(provider.rootAttributes?.([themed], { mode: "public" })).toEqual({
      "data-theme": "corporate",
    });
  });
  test("Daisy theme metadata remains outside semantic component props", () => {
    const provider = createDaisyUIProvider(DAISY_COMPONENT_CATALOG);
    const button = provider.createNode("button", "button-theme");
    button.providerMeta = { theme: "corporate" };
    expect(button.props.theme).toBeUndefined();
    expect(button.providerMeta.theme).toBe("corporate");
  });
});
