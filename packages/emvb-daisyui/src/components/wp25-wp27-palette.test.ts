import { describe, expect, test } from "bun:test";
import { daisyUIProvider } from "../provider.ts";
import { OFFICIAL_DAISYUI_COMPONENTS } from "../conformance/official-inventory.ts";
import { catalogSupportReport } from "../conformance/report.ts";

describe("WP25 categorized palette metadata", () => {
  test("all implemented components have official category, icon, keywords and order", () => {
    for (const generated of daisyUIProvider.components.values()) {
      expect(generated.descriptor.category, generated.definition.id).toBeTruthy();
      expect(generated.descriptor.icon, generated.definition.id).toBeTruthy();
      expect(generated.descriptor.keywords?.length, generated.definition.id).toBeGreaterThan(2);
      expect(generated.descriptor.order, generated.definition.id).toBeNumber();
    }
  });
  test("uses the documented daisyUI palette families", () => {
    const categories = new Set([...daisyUIProvider.components.values()].map((item) => item.descriptor.category));
    for (const category of ["Actions", "Data input", "Data display", "Navigation", "Feedback", "Layout", "Mockup"]) expect(categories.has(category), category).toBe(true);
  });
});

describe("WP26 component icons", () => {
  test("every implemented component has an allowlisted icon identifier", () => {
    for (const generated of daisyUIProvider.components.values()) expect(generated.descriptor.icon).toMatch(/^[a-z][a-z0-9-]*$/);
  });
});

describe("WP27 official catalog inventory", () => {
  test("tracks all 68 official daisyUI 5.7.50 components", () => {
    expect(OFFICIAL_DAISYUI_COMPONENTS).toHaveLength(68);
    expect(new Set(OFFICIAL_DAISYUI_COMPONENTS.map((item) => item.id)).size).toBe(68);
  });
  test("reports implemented, verified, experimental and missing without hiding gaps", () => {
    const report = catalogSupportReport(new Date("2026-01-01T00:00:00Z"));
    expect(report.officialTotal).toBe(68);
    expect(report.implemented + report.missing).toBe(68);
    expect(report.verified).toBe(10);
    expect(report.missing).toBe(0);
    expect(report.components.filter((item) => item.status === "missing")).toEqual([]);
  });
});
