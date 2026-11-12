import type { DaisyComponentNode, DaisyProps } from "../types.ts";

const PARTS: Record<string, string> = { menu: "menu-item", tabs: "tab-item", accordion: "accordion-item", table: "table-row", carousel: "carousel-item" };
export const compoundPartFor = (component: string): string | undefined => PARTS[component];
export const supportsCompoundEditor = (component: string): boolean => component in PARTS;

export function addCompoundItem(parent: DaisyComponentNode, id: string, props: DaisyProps = {}): DaisyComponentNode {
  const component = compoundPartFor(parent.component);
  if (!component) return parent;
  const defaults: DaisyProps = component === "menu-item" ? { label: "Item", href: "#" } : component === "tab-item" ? { label: "Tab" } : component === "accordion-item" ? { label: "Question" } : component === "carousel-item" ? { label: "Slide" } : {};
  return { ...parent, children: [...(parent.children ?? []), { id, type: "provider", provider: "daisyui", component, props: { ...defaults, ...props }, children: [] }] };
}
export function removeCompoundItem(parent: DaisyComponentNode, id: string): DaisyComponentNode { return { ...parent, children: (parent.children ?? []).filter((child) => child.id !== id) }; }
export function moveCompoundItem(parent: DaisyComponentNode, id: string, delta: -1 | 1): DaisyComponentNode {
  const children = [...(parent.children ?? [])]; const from = children.findIndex((child) => child.id === id); const to = from + delta;
  if (from < 0 || to < 0 || to >= children.length) return parent;
  [children[from], children[to]] = [children[to]!, children[from]!]; return { ...parent, children };
}
export function updateCompoundItem(parent: DaisyComponentNode, id: string, props: DaisyProps): DaisyComponentNode { return { ...parent, children: (parent.children ?? []).map((child) => child.id === id ? { ...child, props: { ...child.props, ...props } } : child) }; }
