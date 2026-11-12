import { describe, expect, test } from "bun:test";
import { daisyUIProvider } from "../provider.ts";
import { catalogSupportReport } from "../conformance/report.ts";

const added=["loading","skeleton","radial-progress","toast","label","fieldset","kbd","link","window-mockup","theme-controller","validator","diff","filter"] as const;
describe("WP28 missing primitive components",()=>{
 test("registers and renders each new official component",()=>{for(const id of added){const node=daisyUIProvider.createNode(id,`wp28-${id}`);const vnode=daisyUIProvider.render(node);expect(vnode.attrs.class??vnode.children.length,id).toBeTruthy();}});
 test("loading uses official style and size modifiers",()=>{const node=daisyUIProvider.createNode("loading","loading");node.props.style="dots";node.props.size="lg";expect(daisyUIProvider.render(node).attrs.class).toContain("loading-dots");expect(daisyUIProvider.render(node).attrs.class).toContain("loading-lg");});
 test("radial progress uses div role and clamped official CSS variable",()=>{const node=daisyUIProvider.createNode("radial-progress","radial");node.props.value=140;const vnode=daisyUIProvider.render(node);expect(vnode.tag).toBe("div");expect(vnode.attrs.role).toBe("progressbar");expect(vnode.attrs["aria-valuenow"]).toBe("100");expect(vnode.attrs.style).toBe("--value:100");});
 test("validator produces adjacent validator hint",()=>{const vnode=daisyUIProvider.render(daisyUIProvider.createNode("validator","validator"));expect((vnode.children[0] as any).attrs.class).toContain("validator");expect((vnode.children[1] as any).attrs.class).toBe("validator-hint");});
 test("link rejects executable URLs",()=>{const node=daisyUIProvider.createNode("link","link");node.props.href="javascript:alert(1)";expect(daisyUIProvider.render(node).attrs.href).toBe("#");});
 test("official inventory closes thirteen gaps",()=>{const report=catalogSupportReport(new Date("2026-01-01T00:00:00Z"));expect(report.implemented).toBe(68);expect(report.missing).toBe(0);for(const id of added)expect(report.components.find((item)=>item.id===id)?.status,id).toBe("experimental");});
});
