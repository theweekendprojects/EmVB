import { describe, expect, test } from "bun:test";
import { daisyUIProvider } from "../provider.ts";
import { DAISY_INTERACTIVE_RUNTIME } from "../runtime/browser.ts";
describe("WP21 runtime wiring metadata",()=>{
  test("runtime is requested only by interactive components",()=>{
    expect(daisyUIProvider.needsRuntime?.(daisyUIProvider.createNode("button","button"))).toBe(false);
    for (const id of ["modal","tabs","drawer","dropdown","carousel"]) expect(daisyUIProvider.needsRuntime?.(daisyUIProvider.createNode(id,id)),id).toBe(true);
  });
  test("runtime entry is explicit and keyboard/focus capable",()=>{
    expect(daisyUIProvider.runtimeEntryPoints).toEqual(["@perkyzz/emvb-daisyui/runtime"]);
    expect(DAISY_INTERACTIVE_RUNTIME).toContain("showModal"); expect(DAISY_INTERACTIVE_RUNTIME).toContain("ArrowRight"); expect(DAISY_INTERACTIVE_RUNTIME).toContain("focus()");
  });
});
