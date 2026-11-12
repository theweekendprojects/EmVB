import { describe, expect, test } from "bun:test";
import packageJson from "../../package.json";
import { DAISY_COMPONENT_CATALOG } from "../catalog/index.ts";
import { catalogSupportReport } from "../conformance/report.ts";
describe("WP24 real catalog conformance contract",()=>{
 test("pins official compiler inputs exactly",()=>{expect(packageJson.devDependencies.daisyui).toBe("5.7.50");expect(packageJson.devDependencies.tailwindcss).toBe("4.1.17");});
 test("the official inventory and implementation are complete and unique",()=>{const report=catalogSupportReport(new Date("2026-01-01T00:00:00Z"));expect(report.officialTotal).toBe(68);expect(report.implemented).toBe(68);expect(report.missing).toBe(0);expect(new Set(DAISY_COMPONENT_CATALOG.map(item=>item.id)).size).toBe(68);});
 test("every component provides a real root selector",()=>{for(const definition of DAISY_COMPONENT_CATALOG)expect(definition.rootClass.trim(),definition.id).not.toBe("");});
});
