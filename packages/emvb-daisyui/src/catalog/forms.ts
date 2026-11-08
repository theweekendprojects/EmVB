import type { DaisyComponentDefinition, VNode } from "../types.ts";

const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
const tones = ["neutral", "primary", "secondary", "accent", "info", "success", "warning", "error"] as const;
const variants = ["default", "ghost"] as const;
const sizeMap = (prefix: string) => Object.fromEntries(sizes.map(size => [size, `${prefix}-${size}`]));
const toneMap = (prefix: string) => Object.fromEntries(tones.map(tone => [tone, `${prefix}-${tone}`]));
const variantMap = (prefix: string) => ({ default: "", ghost: `${prefix}-ghost` });

function formControl(tag: string, rootClass: string, fields: DaisyComponentDefinition["fields"]): DaisyComponentDefinition {
  return { id: rootClass, label: rootClass.replace(/\b\w/g, c => c.toUpperCase()), category: "Actions", tag, rootClass, fields };
}
const commonInputFields = (prefix: string) => [
  { key: "name", label: "Name", kind: "text", default: "field", attribute: "name" },
  { key: "label", label: "Accessible label", kind: "text", default: "Field", attribute: "aria-label" },
  { key: "disabled", label: "Disabled", kind: "boolean", default: false, attribute: "disabled" },
  { key: "required", label: "Required", kind: "boolean", default: false, attribute: "required" },
  { key: "size", label: "Size", kind: "select", default: "md", options: sizes, classMap: sizeMap(prefix) },
  { key: "tone", label: "Color", kind: "select", default: "neutral", options: tones, classMap: toneMap(prefix) },
  { key: "variant", label: "Variant", kind: "select", default: "default", options: variants, classMap: variantMap(prefix) },
] as const;

export const INPUT: DaisyComponentDefinition = formControl("input", "input", [
  { key: "type", label: "Type", kind: "select", default: "text", options: ["text", "email", "password", "url", "search", "tel", "number"], attribute: "type" },
  { key: "placeholder", label: "Placeholder", kind: "text", default: "Type here", attribute: "placeholder" },
  { key: "value", label: "Default value", kind: "text", default: "", attribute: "value" },
  ...commonInputFields("input"),
]);

export const TEXTAREA: DaisyComponentDefinition = formControl("textarea", "textarea", [
  { key: "placeholder", label: "Placeholder", kind: "text", default: "Write here", attribute: "placeholder" },
  { key: "value", label: "Default value", kind: "textarea", default: "", textContent: true },
  { key: "rows", label: "Rows", kind: "number", default: 4, attribute: "rows" },
  ...commonInputFields("textarea"),
]);

export const SELECT: DaisyComponentDefinition = {
  ...formControl("select", "select", commonInputFields("select")),
  fields: [
    { key: "options", label: "Options, one per line", kind: "textarea", default: "First option\nSecond option\nThird option" },
    { key: "selected", label: "Selected option", kind: "text", default: "First option" },
    ...commonInputFields("select"),
  ],
  build(node, classes) {
    const selected = String(node.props.selected ?? "");
    const values = String(node.props.options ?? "").split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    return { tag: "select", attrs: { class: classes.join(" "), name: String(node.props.name), "aria-label": String(node.props.label), ...(node.props.disabled ? { disabled: "disabled" } : {}), ...(node.props.required ? { required: "required" } : {}) }, children: values.map(value => ({ tag: "option", attrs: { value, ...(value === selected ? { selected: "selected" } : {}) }, children: [value] })) };
  },
};

function checkDefinition(id: "checkbox" | "radio" | "toggle", label: string): DaisyComponentDefinition {
  return { id, label, category: "Actions", tag: "input", rootClass: id, fields: [
    { key: "name", label: "Name", kind: "text", default: id, attribute: "name" },
    { key: "value", label: "Value", kind: "text", default: "on", attribute: "value" },
    { key: "label", label: "Accessible label", kind: "text", default: label, attribute: "aria-label" },
    { key: "checked", label: "Checked", kind: "boolean", default: false, attribute: "checked" },
    { key: "disabled", label: "Disabled", kind: "boolean", default: false, attribute: "disabled" },
    { key: "size", label: "Size", kind: "select", default: "md", options: sizes, classMap: sizeMap(id) },
    { key: "tone", label: "Color", kind: "select", default: "primary", options: tones, classMap: toneMap(id) },
  ], build(node, classes) { return { tag: "input", attrs: { type: id === "toggle" ? "checkbox" : id, class: classes.join(" "), name: String(node.props.name), value: String(node.props.value), "aria-label": String(node.props.label), ...(node.props.checked ? { checked: "checked" } : {}), ...(node.props.disabled ? { disabled: "disabled" } : {}) }, children: [] }; } };
}
export const CHECKBOX = checkDefinition("checkbox", "Checkbox");
export const RADIO = checkDefinition("radio", "Radio");
export const TOGGLE = checkDefinition("toggle", "Toggle");

export const FILE_INPUT: DaisyComponentDefinition = formControl("input", "file-input", [
  { key: "name", label: "Name", kind: "text", default: "upload", attribute: "name" },
  { key: "label", label: "Accessible label", kind: "text", default: "Choose file", attribute: "aria-label" },
  { key: "accept", label: "Accepted file types", kind: "text", default: "image/*", attribute: "accept" },
  { key: "multiple", label: "Multiple", kind: "boolean", default: false, attribute: "multiple" },
  { key: "disabled", label: "Disabled", kind: "boolean", default: false, attribute: "disabled" },
  { key: "size", label: "Size", kind: "select", default: "md", options: sizes, classMap: sizeMap("file-input") },
  { key: "tone", label: "Color", kind: "select", default: "neutral", options: tones, classMap: toneMap("file-input") },
]);
FILE_INPUT.build = (node, classes) => ({ tag: "input", attrs: { type: "file", class: classes.join(" "), name: String(node.props.name), "aria-label": String(node.props.label), accept: String(node.props.accept), ...(node.props.multiple ? { multiple: "multiple" } : {}), ...(node.props.disabled ? { disabled: "disabled" } : {}) }, children: [] });

export const RANGE: DaisyComponentDefinition = {
  id: "range", label: "Range", category: "Actions", tag: "input", rootClass: "range",
  fields: [
    { key: "name", label: "Name", kind: "text", default: "range", attribute: "name" },
    { key: "label", label: "Accessible label", kind: "text", default: "Range", attribute: "aria-label" },
    { key: "min", label: "Minimum", kind: "number", default: 0, attribute: "min" },
    { key: "max", label: "Maximum", kind: "number", default: 100, attribute: "max" },
    { key: "step", label: "Step", kind: "number", default: 1, attribute: "step" },
    { key: "value", label: "Value", kind: "number", default: 50, attribute: "value" },
    { key: "size", label: "Size", kind: "select", default: "md", options: sizes, classMap: sizeMap("range") },
    { key: "tone", label: "Color", kind: "select", default: "primary", options: tones, classMap: toneMap("range") },
  ], build(node, classes) { const min=Number(node.props.min), max=Number(node.props.max), value=Math.min(max,Math.max(min,Number(node.props.value))); return { tag:"input", attrs:{ type:"range", class:classes.join(" "), name:String(node.props.name), "aria-label":String(node.props.label), min:String(min), max:String(max), step:String(node.props.step), value:String(value) }, children:[] }; },
};

export const RATING: DaisyComponentDefinition = {
  id: "rating", label: "Rating", category: "Actions", tag: "div", rootClass: "rating",
  fields: [
    { key: "name", label: "Name", kind: "text", default: "rating" },
    { key: "label", label: "Accessible label", kind: "text", default: "Rating" },
    { key: "max", label: "Maximum", kind: "number", default: 5 },
    { key: "value", label: "Selected", kind: "number", default: 3 },
    { key: "size", label: "Size", kind: "select", default: "md", options: sizes, classMap: sizeMap("rating") },
  ], build(node, classes) { const max=Math.min(10,Math.max(1,Number(node.props.max))); const selected=Math.min(max,Math.max(0,Number(node.props.value))); const children:VNode[]=[]; for(let i=1;i<=max;i++) children.push({tag:"input",attrs:{type:"radio",name:String(node.props.name),value:String(i),class:"mask mask-star-2 bg-orange-400","aria-label":`${node.props.label} ${i} of ${max}`,...(i===selected?{checked:"checked"}:{})},children:[]}); return {tag:"div",attrs:{class:classes.join(" "),role:"radiogroup","aria-label":String(node.props.label)},children}; },
};

export const FORM_DAISY_COMPONENTS = [INPUT, TEXTAREA, SELECT, CHECKBOX, RADIO, TOGGLE, FILE_INPUT, RANGE, RATING] as const;
