import type { DaisyComponentDefinition, VNode } from "../types.ts";

const tones = ["neutral", "primary", "secondary", "accent", "info", "success", "warning", "error"] as const;
const toneMap = (prefix: string) => Object.fromEntries(tones.map(tone => [tone, `${prefix}-${tone}`]));
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
const sizeMap = (prefix: string) => Object.fromEntries(sizes.map(size => [size, `${prefix}-${size}`]));

export const BUTTON: DaisyComponentDefinition = {
  id: "button", label: "Button", category: "Actions", tag: "button", rootClass: "btn",
  fields: [
    { key: "label", label: "Label", kind: "text", default: "Button", textContent: true },
    { key: "tone", label: "Color", kind: "select", default: "primary", options: tones, classMap: toneMap("btn") },
    { key: "variant", label: "Variant", kind: "select", default: "solid", options: ["solid", "outline", "dash", "soft", "ghost", "link"], classMap: { solid: "", outline: "btn-outline", dash: "btn-dash", soft: "btn-soft", ghost: "btn-ghost", link: "btn-link" } },
    { key: "size", label: "Size", kind: "select", default: "md", options: sizes, classMap: sizeMap("btn") },
    { key: "disabled", label: "Disabled", kind: "boolean", default: false, attribute: "disabled" },
  ],
};

export const BADGE: DaisyComponentDefinition = {
  id: "badge", label: "Badge", category: "Data display", tag: "span", rootClass: "badge",
  fields: [
    { key: "label", label: "Label", kind: "text", default: "Badge", textContent: true },
    { key: "tone", label: "Color", kind: "select", default: "neutral", options: tones, classMap: toneMap("badge") },
    { key: "variant", label: "Variant", kind: "select", default: "solid", options: ["solid", "outline", "dash", "soft", "ghost"], classMap: { solid: "", outline: "badge-outline", dash: "badge-dash", soft: "badge-soft", ghost: "badge-ghost" } },
  ],
};

export const ALERT: DaisyComponentDefinition = {
  id: "alert", label: "Alert", category: "Feedback", tag: "div", rootClass: "alert", role: "alert",
  fields: [
    { key: "message", label: "Message", kind: "textarea", default: "Your message goes here.", textContent: true },
    { key: "tone", label: "Status", kind: "select", default: "info", options: ["info", "success", "warning", "error"], classMap: { info: "alert-info", success: "alert-success", warning: "alert-warning", error: "alert-error" } },
    { key: "variant", label: "Variant", kind: "select", default: "soft", options: ["solid", "outline", "dash", "soft"], classMap: { solid: "", outline: "alert-outline", dash: "alert-dash", soft: "alert-soft" } },
  ],
};

export const CARD: DaisyComponentDefinition = {
  id: "card", label: "Card", category: "Layout", tag: "article", rootClass: "card", container: true,
  fields: [
    { key: "title", label: "Title", kind: "text", default: "Card title" },
    { key: "body", label: "Body", kind: "textarea", default: "Add supporting content to this card." },
    { key: "bordered", label: "Border", kind: "boolean", default: true, classMap: { true: "card-border", false: "" } },
    { key: "size", label: "Size", kind: "select", default: "md", options: sizes, classMap: sizeMap("card") },
  ],
  build(node, classes, children) {
    const content: VNode[] = [
      { tag: "h2", attrs: { class: "card-title" }, children: [String(node.props.title)] },
      { tag: "p", attrs: {}, children: [String(node.props.body)] },
      ...children,
    ];
    return { tag: "article", attrs: { class: classes.filter(Boolean).join(" ") }, children: [{ tag: "div", attrs: { class: "card-body" }, children: content }] };
  },
};

export const PROGRESS: DaisyComponentDefinition = {
  id: "progress", label: "Progress", category: "Data display", tag: "progress", rootClass: "progress",
  fields: [
    { key: "value", label: "Value", kind: "number", default: 40, attribute: "value" },
    { key: "max", label: "Maximum", kind: "number", default: 100, attribute: "max" },
    { key: "tone", label: "Color", kind: "select", default: "primary", options: tones, classMap: toneMap("progress") },
  ],
};

export const STATS: DaisyComponentDefinition = {
  id: "stats", label: "Statistic", category: "Data display", tag: "div", rootClass: "stats", role: "group",
  fields: [
    { key: "title", label: "Title", kind: "text", default: "Total users" },
    { key: "value", label: "Value", kind: "text", default: "31K" },
    { key: "description", label: "Description", kind: "text", default: "12% increase" },
    { key: "direction", label: "Direction", kind: "select", default: "horizontal", options: ["horizontal", "vertical"], classMap: { horizontal: "stats-horizontal", vertical: "stats-vertical" } },
  ],
  build(node, classes) {
    return { tag: "div", attrs: { class: classes.join(" "), role: "group" }, children: [{ tag: "div", attrs: { class: "stat" }, children: [
      { tag: "div", attrs: { class: "stat-title" }, children: [String(node.props.title)] },
      { tag: "div", attrs: { class: "stat-value" }, children: [String(node.props.value)] },
      { tag: "div", attrs: { class: "stat-desc" }, children: [String(node.props.description)] },
    ] }] };
  },
};

export const BASIC_DAISY_COMPONENTS = [BUTTON, BADGE, ALERT, CARD, PROGRESS, STATS] as const;
