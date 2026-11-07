import type { DaisyComponentDefinition, VNode } from "../types.ts";
import { safeHref } from "../render/href.ts";

const lines = (value: unknown) => String(value ?? "").split(/\r?\n/).map(item => item.trim()).filter(Boolean);
const clamp = (value: unknown, min: number, max: number) => Math.min(max, Math.max(min, Number(value)));

export const TABS: DaisyComponentDefinition = {
  id: "tabs", label: "Tabs", category: "Navigation", tag: "div", rootClass: "tabs",
  fields: [
    { key: "label", label: "Tabs label", kind: "text", default: "Content tabs" },
    { key: "items", label: "Tabs, Label|Content per line", kind: "textarea", default: "Overview|Overview content\nDetails|Details content\nReviews|Reviews content" },
    { key: "active", label: "Active tab", kind: "number", default: 1 },
    { key: "style", label: "Style", kind: "select", default: "box", options: ["box", "border", "lift"], classMap: { box: "tabs-box", border: "tabs-border", lift: "tabs-lift" } },
  ],
  build(node, classes) {
    const items = lines(node.props.items).slice(0, 12).map(entry => { const [label, content = ""] = entry.split("|"); return { label: label || "Tab", content }; });
    const active = clamp(node.props.active, 1, Math.max(1, items.length));
    const group = `tabs-${node.id}`;
    const children: VNode[] = [];
    items.forEach((item, index) => {
      const selected = index + 1 === active;
      children.push({ tag: "input", attrs: { type: "radio", name: group, class: "tab", "aria-label": item.label, ...(selected ? { checked: "checked" } : {}) }, children: [] });
      children.push({ tag: "div", attrs: { class: "tab-content border-base-300 bg-base-100 p-6", role: "tabpanel" }, children: [item.content] });
    });
    return { tag: "div", attrs: { class: classes.join(" "), role: "tablist", "aria-label": String(node.props.label) }, children };
  },
};

export const ACCORDION: DaisyComponentDefinition = {
  id: "accordion", label: "Accordion", category: "Layout", tag: "div", rootClass: "join join-vertical", container: true,
  fields: [
    { key: "label", label: "Accordion label", kind: "text", default: "Frequently asked questions" },
    { key: "items", label: "Items, Title|Content per line", kind: "textarea", default: "What is EmVB?|A visual editor for EmDash.\nDoes it support themes?|Yes, through daisyUI themes." },
    { key: "open", label: "Open item", kind: "number", default: 1 },
    { key: "icon", label: "Icon", kind: "select", default: "arrow", options: ["arrow", "plus"], classMap: { arrow: "collapse-arrow", plus: "collapse-plus" } },
  ],
  build(node, classes, children) {
    const items = lines(node.props.items).slice(0, 20);
    const open = clamp(node.props.open, 0, items.length);
    return { tag: "div", attrs: { class: classes.join(" "), "aria-label": String(node.props.label) }, children: [
      ...items.map((entry, index): VNode => { const [title, content = ""] = entry.split("|"); return { tag: "details", attrs: { class: "collapse join-item border-base-300 border", ...(index + 1 === open ? { open: "open" } : {}) }, children: [
        { tag: "summary", attrs: { class: "collapse-title font-semibold" }, children: [title || "Item"] },
        { tag: "div", attrs: { class: "collapse-content text-sm" }, children: [content] },
      ] }; }), ...children,
    ] };
  },
};

export const DROPDOWN: DaisyComponentDefinition = {
  id: "dropdown", label: "Dropdown", category: "Navigation", tag: "details", rootClass: "dropdown",
  fields: [
    { key: "label", label: "Button label", kind: "text", default: "Open menu" },
    { key: "items", label: "Items, Label|URL per line", kind: "textarea", default: "Profile|/profile\nSettings|/settings\nSign out|/logout" },
    { key: "open", label: "Open in editor", kind: "boolean", default: false, attribute: "open" },
    { key: "align", label: "Alignment", kind: "select", default: "start", options: ["start", "end", "top", "bottom"], classMap: { start: "dropdown-start", end: "dropdown-end", top: "dropdown-top", bottom: "dropdown-bottom" } },
  ],
  build(node, classes) { return { tag: "details", attrs: { class: classes.join(" "), ...(node.props.open ? { open: "open" } : {}) }, children: [
    { tag: "summary", attrs: { class: "btn m-1" }, children: [String(node.props.label)] },
    { tag: "ul", attrs: { class: "menu dropdown-content bg-base-100 rounded-box z-10 w-52 p-2 shadow", role: "menu" }, children: lines(node.props.items).slice(0, 20).map(entry => { const [label, href = "#"] = entry.split("|"); return { tag: "li", attrs: { role: "none" }, children: [{ tag: "a", attrs: { href: safeHref(href), role: "menuitem" }, children: [label || "Item"] }] }; }) },
  ] }; },
};

export const MODAL: DaisyComponentDefinition = {
  id: "modal", label: "Modal", category: "Feedback", tag: "dialog", rootClass: "modal", container: true,
  fields: [
    { key: "title", label: "Title", kind: "text", default: "Confirm action" },
    { key: "body", label: "Body", kind: "textarea", default: "Review the information before continuing." },
    { key: "open", label: "Open in editor", kind: "boolean", default: true, attribute: "open" },
    { key: "closeLabel", label: "Close label", kind: "text", default: "Close" },
    { key: "position", label: "Position", kind: "select", default: "middle", options: ["middle", "top", "bottom"], classMap: { middle: "modal-middle", top: "modal-top", bottom: "modal-bottom" } },
  ],
  build(node, classes, children) {
    const titleId = `${node.id}-title`;
    return { tag: "dialog", attrs: { class: classes.join(" "), "aria-labelledby": titleId, ...(node.props.open ? { open: "open" } : {}) }, children: [
      { tag: "div", attrs: { class: "modal-box" }, children: [
        { tag: "h2", attrs: { id: titleId, class: "text-lg font-bold" }, children: [String(node.props.title)] },
        { tag: "p", attrs: { class: "py-4" }, children: [String(node.props.body)] },
        ...children,
        { tag: "form", attrs: { method: "dialog", class: "modal-action" }, children: [{ tag: "button", attrs: { class: "btn" }, children: [String(node.props.closeLabel)] }] },
      ] },
      { tag: "form", attrs: { method: "dialog", class: "modal-backdrop" }, children: [{ tag: "button", attrs: { "aria-label": String(node.props.closeLabel) }, children: ["close"] }] },
    ] };
  },
};

export const DRAWER: DaisyComponentDefinition = {
  id: "drawer", label: "Drawer", category: "Layout", tag: "div", rootClass: "drawer", container: true,
  fields: [
    { key: "label", label: "Drawer label", kind: "text", default: "Navigation drawer" },
    { key: "buttonLabel", label: "Button label", kind: "text", default: "Open drawer" },
    { key: "side", label: "Side", kind: "select", default: "start", options: ["start", "end"], classMap: { start: "", end: "drawer-end" } },
    { key: "open", label: "Open in editor", kind: "boolean", default: false },
  ],
  build(node, classes, children) {
    const controlId = `${node.id}-control`;
    return { tag: "div", attrs: { class: classes.join(" ") }, children: [
      { tag: "input", attrs: { id: controlId, type: "checkbox", class: "drawer-toggle", "aria-label": String(node.props.label), ...(node.props.open ? { checked: "checked" } : {}) }, children: [] },
      { tag: "div", attrs: { class: "drawer-content" }, children: [{ tag: "label", attrs: { for: controlId, class: "btn drawer-button" }, children: [String(node.props.buttonLabel)] }, ...children] },
      { tag: "div", attrs: { class: "drawer-side" }, children: [{ tag: "label", attrs: { for: controlId, "aria-label": "Close drawer", class: "drawer-overlay" }, children: [] }, { tag: "div", attrs: { class: "bg-base-200 min-h-full w-80 p-4" }, children: [String(node.props.label)] }] },
    ] };
  },
};

export const CAROUSEL: DaisyComponentDefinition = {
  id: "carousel", label: "Carousel", category: "Layout", tag: "section", rootClass: "carousel", container: true,
  fields: [
    { key: "label", label: "Carousel label", kind: "text", default: "Featured content" },
    { key: "slides", label: "Slides, Title|Description per line", kind: "textarea", default: "First slide|Welcome to EmVB\nSecond slide|Build with daisyUI\nThird slide|Publish with Astro" },
    { key: "current", label: "Current slide", kind: "number", default: 1 },
    { key: "width", label: "Width", kind: "select", default: "full", options: ["full", "compact"], classMap: { full: "w-full", compact: "max-w-2xl" } },
  ],
  build(node, classes, children) {
    const slides = lines(node.props.slides).slice(0, 20);
    const current = clamp(node.props.current, 1, Math.max(1, slides.length));
    return { tag: "section", attrs: { class: classes.join(" "), "aria-label": String(node.props.label), "aria-roledescription": "carousel" }, children: [
      ...slides.map((entry, index): VNode => { const [title, description = ""] = entry.split("|"); return { tag: "article", attrs: { id: `${node.id}-slide-${index + 1}`, class: "carousel-item relative w-full", role: "group", "aria-label": `${index + 1} of ${slides.length}`, ...(index + 1 !== current ? { "aria-hidden": "true" } : {}) }, children: [{ tag: "div", attrs: { class: "hero min-h-64 bg-base-200" }, children: [{ tag: "div", attrs: { class: "hero-content text-center" }, children: [{ tag: "div", attrs: {}, children: [{ tag: "h2", attrs: { class: "text-3xl font-bold" }, children: [title || "Slide"] }, { tag: "p", attrs: { class: "py-4" }, children: [description] }] }] }] }] }; }),
      ...children,
    ] };
  },
};

export const COLLAPSE: DaisyComponentDefinition = {
  id: "collapse", label: "Collapse", category: "Layout", tag: "details", rootClass: "collapse bg-base-100 border-base-300 border", container: true,
  fields: [
    { key: "title", label: "Title", kind: "text", default: "More information" },
    { key: "content", label: "Content", kind: "textarea", default: "Additional details appear here." },
    { key: "open", label: "Open", kind: "boolean", default: false, attribute: "open" },
    { key: "icon", label: "Icon", kind: "select", default: "arrow", options: ["arrow", "plus"], classMap: { arrow: "collapse-arrow", plus: "collapse-plus" } },
  ],
  build(node, classes, children) { return { tag: "details", attrs: { class: classes.join(" "), ...(node.props.open ? { open: "open" } : {}) }, children: [{ tag: "summary", attrs: { class: "collapse-title font-semibold" }, children: [String(node.props.title)] }, { tag: "div", attrs: { class: "collapse-content text-sm" }, children: [String(node.props.content), ...children] }] }; },
};

export const SWAP: DaisyComponentDefinition = {
  id: "swap", label: "Swap", category: "Actions", tag: "label", rootClass: "swap",
  fields: [
    { key: "label", label: "Accessible label", kind: "text", default: "Toggle state" },
    { key: "on", label: "On text", kind: "text", default: "ON" },
    { key: "off", label: "Off text", kind: "text", default: "OFF" },
    { key: "active", label: "Active", kind: "boolean", default: false },
    { key: "effect", label: "Effect", kind: "select", default: "rotate", options: ["rotate", "flip"], classMap: { rotate: "swap-rotate", flip: "swap-flip" } },
  ],
  build(node, classes) { return { tag: "label", attrs: { class: classes.join(" "), "aria-label": String(node.props.label) }, children: [{ tag: "input", attrs: { type: "checkbox", ...(node.props.active ? { checked: "checked" } : {}) }, children: [] }, { tag: "span", attrs: { class: "swap-on" }, children: [String(node.props.on)] }, { tag: "span", attrs: { class: "swap-off" }, children: [String(node.props.off)] }] }; },
};

export const INTERACTIVE_DAISY_COMPONENTS = [TABS, ACCORDION, DROPDOWN, MODAL, DRAWER, CAROUSEL, COLLAPSE, SWAP] as const;
