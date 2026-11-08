import { describe, expect, test } from "bun:test";
import { generateBrandTheme, generateDaisyThemeCss, themeAttributes, validateThemeConfig } from "./index.ts";

describe("daisyUI themes", () => {
  test("renders default and section-level data-theme attributes", () => {
    expect(themeAttributes(undefined)).toEqual({ "data-theme": "light" });
    expect(themeAttributes("corporate")).toEqual({ "data-theme": "corporate" });
  });
  test("generates deterministic plugin configuration", () => {
    expect(generateDaisyThemeCss({ defaultTheme: "corporate", darkTheme: "business", enabledThemes: ["corporate", "business"] })).toContain("corporate --default, business --prefersdark");
  });
  test("validates configuration and brand colors", () => {
    expect(validateThemeConfig({ defaultTheme: "missing", enabledThemes: ["light"] })).toContain("Default theme must be enabled");
    expect(generateBrandTheme("emdash", { primary: "#2563eb", secondary: "#7c3aed", accent: "#0d9488" })).toContain('name: "emdash"');
  });
});
