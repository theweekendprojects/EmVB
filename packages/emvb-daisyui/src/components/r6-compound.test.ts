import { describe, expect, test } from "bun:test";
import { migrateLegacyItems, renderCompoundNode } from "../compound/index.ts";
import type { DaisyComponentNode } from "../types.ts";
const node = (
  component: string,
  props = {},
  children: DaisyComponentNode[] = [],
): DaisyComponentNode => ({
  id: `${component}-1`,
  type: "provider",
  provider: "daisyui",
  component,
  props,
  children,
});
describe("R6 typed compound component parts", () => {
  test("renders tabs with explicit tab-panel relationships", () => {
    const vnode = renderCompoundNode(node("tab-item", { label: "Overview", selected: true }));
    const tab = vnode.children[0] as { attrs: Record<string, string> };
    const panel = vnode.children[1] as { attrs: Record<string, string> };
    expect(tab.attrs.role).toBe("tab");
    expect(tab.attrs["aria-controls"]).toBe(panel.attrs.id);
    expect(panel.attrs["aria-labelledby"]).toBe(tab.attrs.id);
  });
  test("renders semantic table parts and details accordion", () => {
    expect(renderCompoundNode(node("table-header-cell", { text: "Name" })).attrs.scope).toBe("col");
    expect(
      renderCompoundNode(node("accordion-item", { label: "Question", defaultOpen: true })).tag,
    ).toBe("details");
  });
  test("migrates legacy line items to typed children", () => {
    let id = 0;
    const migrated = migrateLegacyItems(
      node("menu", { items: "Home|/\nAbout|/about" }),
      () => `item-${++id}`,
    );
    expect(migrated.props.items).toBeUndefined();
    expect(migrated.children?.map((child) => child.component)).toEqual(["menu-item", "menu-item"]);
  });
});
