import { describe, expect, test } from "bun:test";
import { DAISYUI_CONFORMANCE, verifyCompiledCss } from "../conformance/index.ts";
describe("compiled CSS conformance", () => {
  test("accepts CSS containing every required selector", () => {
    const css = DAISYUI_CONFORMANCE.requiredSelectors.map((selector) => `${selector}{display:block}`).join("\n");
    expect(verifyCompiledCss(css)).toEqual({ ok: true, checked: 10, missing: [] });
  });
  test("reports missing selectors", () => expect(verifyCompiledCss(".btn{}" ).missing).toContain(".card"));
});
