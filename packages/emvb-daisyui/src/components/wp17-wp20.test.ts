import { describe, expect, test } from "bun:test";
import { addCompoundItem, moveCompoundItem, removeCompoundItem } from "../compound/editor.ts";
import { DAISY_INTERACTIVE_RUNTIME, serializableNode } from "../runtime/index.ts";
import { catalogSupportReport } from "../conformance/report.ts";
import type { DaisyComponentNode } from "../types.ts";
const menu: DaisyComponentNode = { id: "menu", type: "provider", provider: "daisyui", component: "menu", props: {}, children: [] };
describe("WP17 compound editor", () => { test("adds reorders and removes typed children", () => { const a=addCompoundItem(menu,"a",{label:"A"}); const b=addCompoundItem(a,"b",{label:"B"}); expect(b.children?.map(x=>x.component)).toEqual(["menu-item","menu-item"]); expect(moveCompoundItem(b,"b",-1).children?.[0]?.id).toBe("b"); expect(removeCompoundItem(b,"a").children?.map(x=>x.id)).toEqual(["b"]); }); });
describe("WP18 runtime", () => { test("supports native dialog and WAI-ARIA tab keys", () => { expect(DAISY_INTERACTIVE_RUNTIME).toContain("showModal"); expect(DAISY_INTERACTIVE_RUNTIME).toContain("ArrowRight"); expect(DAISY_INTERACTIVE_RUNTIME).toContain("Home"); expect(DAISY_INTERACTIVE_RUNTIME).toContain("End"); }); test("does not serialize preview state",()=>{ const m={...menu,component:"modal",props:{open:true}}; expect(serializableNode(m).props.open).toBeUndefined(); }); });
describe("WP20 support report",()=>{ test("is pinned and truthful",()=>{ const r=catalogSupportReport(new Date("2026-01-01T00:00:00Z")); expect(r.daisyuiVersion).toBe("5.7.50"); expect(r.tailwindcssVersion).toBe("4.1.17"); expect(r.verified).toBe(10); expect(r.experimental).toBeGreaterThan(0); }); });
