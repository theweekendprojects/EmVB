import { describe, expect, test } from "bun:test";
import { compatibilityReport, DAISY_CATALOG_VERSION, migrateDaisyLayout } from "../compatibility/index.ts";

describe("WP12 upgrade and compatibility", () => {
  test("catalog compatibility report has no errors", () => {
    const report = compatibilityReport();
    expect(report.compatible).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.componentCount).toBeGreaterThanOrEqual(40);
    expect(report.classCount).toBeGreaterThan(40);
  });
  test("migrates legacy property names recursively", () => {
    const result = migrateDaisyLayout({ catalogVersion: 0, nodes: [{ id: "root1", type: "daisy", component: "card", props: {}, children: [{ id: "btn11", type: "daisy", component: "button", props: { text: "Continue" } }] }] });
    expect(result.layout.catalogVersion).toBe(DAISY_CATALOG_VERSION);
    expect(result.layout.nodes[0]?.children?.[0]?.props).toEqual({ label: "Continue" });
    expect(result.notices).toHaveLength(1);
  });
  test("rejects layouts from a newer catalog", () => expect(() => migrateDaisyLayout({ catalogVersion: 99, nodes: [] })).toThrow("newer"));
});
