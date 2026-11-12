import { describe, expect, test } from "bun:test";
import { daisyUIProvider } from "../provider.ts";
import { editorIntegrationAudit } from "../integration/editability.ts";
describe("WP31 full editor integration contract",()=>{
 test("classifies all 68 components with no unresolved integration",()=>{const audit=editorIntegrationAudit();expect(audit).toHaveLength(68);expect(audit.filter(item=>!item.ok)).toEqual([]);expect(audit.filter(item=>item.mode==="compound").map(item=>item.id)).toEqual(["accordion","carousel","menu","tabs","table"]);});
 test("Progress exposes accessible and optional visible text",()=>{const node=daisyUIProvider.createNode("progress","progress");node.props.label="Upload progress";node.props.visibleLabel="Uploading 40%";const vnode=daisyUIProvider.render(node);expect(vnode.attrs["aria-label"]).toBe("Upload progress");expect((vnode.children[0] as any).children).toEqual(["Uploading 40%"]);});
});
