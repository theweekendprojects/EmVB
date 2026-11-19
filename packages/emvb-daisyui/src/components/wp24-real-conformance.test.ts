import { describe, expect, test } from "bun:test";
import packageJson from "../../package.json";
import { DAISY_COMPONENT_CATALOG } from "../catalog/index.ts";
import { catalogSupportReport } from "../conformance/report.ts";
describe("WP24 real catalog conformance contract", () => {
  test("pins official compiler inputs exactly", () => {
    expect(packageJson.devDependencies.daisyui).toBe("5.7.50");
    expect(packageJson.devDependencies.tailwindcss).toBe("4.1.17");
  });
  test("the official inventory and implementation are complete and unique", () => {
    const report = catalogSupportReport(new Date("2026-01-01T00:00:00Z"));
    expect(report.officialTotal).toBe(68);
    expect(report.implemented).toBe(68);
    expect(report.missing).toBe(0);
    // One declared addition beyond the official 68: a container with layout presets. daisyUI has no
    // container, so it is listed here on purpose; any other extra component fails this test.
    const ids = DAISY_COMPONENT_CATALOG.map((item) => item.id);
    expect(new Set(ids).size).toBe(69);
    expect(ids.filter((id) => id === "container")).toHaveLength(1);
  });
  test("every component provides a real root selector", () => {
    for (const definition of DAISY_COMPONENT_CATALOG)
      expect(definition.rootClass.trim(), definition.id).not.toBe("");
  });
});
