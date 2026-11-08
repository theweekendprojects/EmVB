import type { DaisyComponentNode, VNode } from "../types.ts";
import { safeHref } from "../render/href.ts";

export const COMPOUND_PARTS = ["menu-item", "tab-item", "accordion-item", "table-head", "table-body", "table-row", "table-header-cell", "table-cell", "carousel-item"] as const;
export type CompoundPartId = (typeof COMPOUND_PARTS)[number];
export const isCompoundPart = (id: string): id is CompoundPartId => (COMPOUND_PARTS as readonly string[]).includes(id);

const text = (node: DaisyComponentNode, key: string, fallback: string) => String(node.props[key] ?? fallback);

export function renderCompoundNode(node: DaisyComponentNode, renderedChildren: VNode[] = []): VNode {
  switch (node.component) {
    case "menu-item": return { tag: "li", attrs: {}, children: [{ tag: "a", attrs: { href: safeHref(text(node, "href", "#")) }, children: [text(node, "label", "Item"), ...renderedChildren] }] };
    case "tab-item": { const tabId = `tab-${node.id}`; const panelId = `panel-${node.id}`; return { tag: "div", attrs: { class: "contents" }, children: [{ tag: "button", attrs: { id: tabId, class: "tab", role: "tab", "aria-controls": panelId, "aria-selected": node.props.selected === true ? "true" : "false", tabindex: node.props.selected === true ? "0" : "-1" }, children: [text(node, "label", "Tab")] }, { tag: "div", attrs: { id: panelId, class: "tab-content", role: "tabpanel", "aria-labelledby": tabId, tabindex: "0" }, children: renderedChildren }] }; }
    case "accordion-item": return { tag: "details", attrs: { class: "collapse collapse-arrow", ...(node.props.defaultOpen === true ? { open: "" } : {}) }, children: [{ tag: "summary", attrs: { class: "collapse-title" }, children: [text(node, "label", "Question")] }, { tag: "div", attrs: { class: "collapse-content" }, children: renderedChildren }] };
    case "table-head": return { tag: "thead", attrs: {}, children: renderedChildren };
    case "table-body": return { tag: "tbody", attrs: {}, children: renderedChildren };
    case "table-row": return { tag: "tr", attrs: {}, children: renderedChildren };
    case "table-header-cell": return { tag: "th", attrs: { scope: text(node, "scope", "col") }, children: [text(node, "text", "Heading")] };
    case "table-cell": return { tag: "td", attrs: {}, children: [text(node, "text", "Cell")] };
    case "carousel-item": return { tag: "div", attrs: { id: `slide-${node.id}`, class: "carousel-item w-full", role: "group", "aria-label": text(node, "label", "Slide") }, children: renderedChildren };
    default: throw new Error(`Not a compound daisyUI part: ${node.component}`);
  }
}

export function migrateLegacyItems(node: DaisyComponentNode, id: () => string): DaisyComponentNode {
  if (node.children?.length) return node;
  const lines = typeof node.props.items === "string" ? node.props.items.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : [];
  if (!lines.length) return node;
  const part = node.component === "menu" ? "menu-item" : node.component === "tabs" ? "tab-item" : node.component === "accordion" ? "accordion-item" : node.component === "carousel" ? "carousel-item" : undefined;
  if (!part) return node;
  const children = lines.map((line, index): DaisyComponentNode => { const [label, value = ""] = line.split("|"); return { id: id(), type: "provider", provider: "daisyui", component: part, props: { label: label || `Item ${index + 1}`, ...(part === "menu-item" ? { href: value || "#" } : {}) }, children: [] }; });
  const props = { ...node.props }; delete props.items;
  return { ...node, props, children };
}
