import { describe, expect, test } from "bun:test";
import { createDaisyUIProvider } from "../render/provider.ts";
import { DAISY_COMPONENT_CATALOG } from "../catalog/index.ts";

describe("WP15 default and component theme activation", () => {
  test("provider applies official light theme at the page root", () => {
    const provider = createDaisyUIProvider(DAISY_COMPONENT_CATALOG);
    expect(provider.rootAttributes?.([], { mode: "public" })).toEqual({ "data-theme": "light" });
  });
  test("Daisy theme metadata remains outside semantic component props", () => {
    const provider = createDaisyUIProvider(DAISY_COMPONENT_CATALOG);
    const button = provider.createNode("button", "button-theme");
    button.providerMeta = { theme: "corporate" };
    expect(button.props.theme).toBeUndefined();
    expect(button.providerMeta.theme).toBe("corporate");
  });
});
