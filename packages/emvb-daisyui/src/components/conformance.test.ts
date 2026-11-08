import { describe, expect, test } from "bun:test";
import { DAISYUI_CONFORMANCE, isVerifiedDaisyComponent } from "../conformance/index.ts";
import { daisyUIProvider } from "../provider.ts";
import packageJson from "../../package.json";

describe("official daisyUI conformance boundary", () => {
  test("pins the exact packages used by the manifest", () => {
    expect(packageJson.peerDependencies.daisyui).toBe(DAISYUI_CONFORMANCE.daisyuiVersion);
    expect(packageJson.peerDependencies.tailwindcss).toBe(DAISYUI_CONFORMANCE.tailwindcssVersion);
    expect(packageJson.devDependencies.daisyui).toBe(DAISYUI_CONFORMANCE.daisyuiVersion);
    expect(packageJson.devDependencies.tailwindcss).toBe(DAISYUI_CONFORMANCE.tailwindcssVersion);
  });

  test("every verified component exists and has the expected official root selector", () => {
    for (const [index, id] of DAISYUI_CONFORMANCE.verifiedComponents.entries()) {
      const generated = daisyUIProvider.components.get(id);
      expect(generated, `${id} is registered`).toBeDefined();
      expect(generated!.definition.rootClass.split(/\s+/)).toContain(
        DAISYUI_CONFORMANCE.requiredSelectors[index]!.slice(1),
      );
      expect(isVerifiedDaisyComponent(id)).toBe(true);
    }
  });

  test("does not silently call the rest of the catalog verified", () => {
    expect([...daisyUIProvider.components.keys()].filter(isVerifiedDaisyComponent)).toHaveLength(10);
    expect(daisyUIProvider.components.size).toBeGreaterThan(10);
  });
});
