import type { DaisyComponentDefinition, DaisyVNode } from "../types.ts";
import { safeHref } from "../render/href.ts";
const clamp = (value: unknown, min: number, max: number) =>
  Math.min(max, Math.max(min, Number(value)));

export const HERO: DaisyComponentDefinition = {
  id: "hero",
  label: "Hero",
  category: "Marketing",
  tag: "section",
  rootClass: "hero",
  container: true,
  fields: [
    { key: "title", label: "Title", kind: "text", default: "Build beautiful pages" },
    {
      key: "body",
      label: "Body",
      kind: "textarea",
      default: "Compose EmDash pages visually with daisyUI.",
    },
    { key: "action", label: "Action label", kind: "text", default: "Get started" },
    { key: "href", label: "Action URL", kind: "href", default: "#start" },
    {
      key: "height",
      label: "Height",
      kind: "select",
      default: "md",
      options: ["sm", "md", "lg", "screen"],
      classMap: { sm: "min-h-64", md: "min-h-96", lg: "min-h-[32rem]", screen: "min-h-screen" },
    },
    {
      key: "align",
      label: "Alignment",
      kind: "select",
      default: "center",
      options: ["start", "center", "end"],
      classMap: { start: "text-left", center: "text-center", end: "text-right" },
    },
  ],
  build(node, classes, children) {
    return {
      tag: "section",
      attrs: { class: classes.join(" ") },
      children: [
        {
          tag: "div",
          attrs: { class: "hero-content" },
          children: [
            {
              tag: "div",
              attrs: { class: "max-w-xl" },
              children: [
                {
                  tag: "h1",
                  attrs: { class: "text-5xl font-bold" },
                  children: [String(node.props.title)],
                },
                { tag: "p", attrs: { class: "py-6" }, children: [String(node.props.body)] },
                {
                  tag: "a",
                  attrs: { class: "btn btn-primary", href: safeHref(node.props.href) },
                  children: [String(node.props.action)],
                },
                ...children,
              ],
            },
          ],
        },
      ],
    };
  },
};
export const STACK: DaisyComponentDefinition = {
  id: "stack",
  label: "Stack",
  category: "Layout",
  tag: "div",
  rootClass: "stack",
  container: true,
  fields: [
    { key: "label", label: "Stack label", kind: "text", default: "Stacked content" },
    { key: "count", label: "Placeholder layers", kind: "number", default: 3 },
    {
      key: "size",
      label: "Size",
      kind: "select",
      default: "md",
      options: ["sm", "md", "lg"],
      classMap: { sm: "w-48", md: "w-72", lg: "w-96" },
    },
    {
      key: "placement",
      label: "Layer order",
      kind: "select",
      default: "default",
      options: ["default", "top", "bottom", "start", "end"],
      optionLabels: {
        default: "Last child on top",
        top: "First child on top",
        bottom: "First child at the bottom",
        start: "Stacked to the start",
        end: "Stacked to the end",
      },
      classMap: {
        default: "",
        top: "stack-top",
        bottom: "stack-bottom",
        start: "stack-start",
        end: "stack-end",
      },
    },
  ],
  build(node, classes, children) {
    const count = clamp(node.props.count, 1, 6);
    const placeholders: Array<DaisyVNode> = Array.from(
      { length: Math.max(0, count - children.length) },
      (_, i) => ({
        tag: "div",
        attrs: { class: "card bg-base-200 shadow-sm" },
        children: [{ tag: "div", attrs: { class: "card-body" }, children: [`Layer ${i + 1}`] }],
      }),
    );
    return {
      tag: "div",
      attrs: { class: classes.join(" "), "aria-label": String(node.props.label) },
      children: [...children, ...placeholders].slice(0, count),
    };
  },
};
export const DIVIDER: DaisyComponentDefinition = {
  id: "divider",
  label: "Divider",
  category: "Layout",
  tag: "div",
  rootClass: "divider",
  fields: [
    { key: "label", label: "Label", kind: "text", default: "OR", textContent: true },
    {
      key: "direction",
      label: "Direction",
      kind: "select",
      default: "horizontal",
      options: ["horizontal", "vertical"],
      classMap: { horizontal: "divider-horizontal", vertical: "divider-vertical" },
    },
    {
      key: "placement",
      label: "Label position",
      kind: "select",
      default: "center",
      options: ["center", "start", "end"],
      optionLabels: { center: "Centred", start: "Start", end: "End" },
      classMap: { center: "", start: "divider-start", end: "divider-end" },
    },
    {
      key: "tone",
      label: "Color",
      kind: "select",
      default: "neutral",
      options: ["neutral", "primary", "secondary", "accent", "success", "warning", "error"],
      classMap: {
        neutral: "divider-neutral",
        primary: "divider-primary",
        secondary: "divider-secondary",
        accent: "divider-accent",
        success: "divider-success",
        warning: "divider-warning",
        error: "divider-error",
      },
    },
  ],
};
export const JOIN: DaisyComponentDefinition = {
  id: "join",
  label: "Join",
  category: "Layout",
  tag: "div",
  rootClass: "join",
  container: true,
  fields: [
    { key: "label", label: "Group label", kind: "text", default: "Joined controls" },
    {
      key: "direction",
      label: "Direction",
      kind: "select",
      default: "horizontal",
      options: ["horizontal", "vertical"],
      classMap: { horizontal: "join-horizontal", vertical: "join-vertical" },
    },
  ],
  build(node, classes, children) {
    return {
      tag: "div",
      attrs: { class: classes.join(" "), role: "group", "aria-label": String(node.props.label) },
      children: children.map((child) => ({
        ...child,
        attrs: {
          ...child.attrs,
          class: [child.attrs.class, "join-item"].filter(Boolean).join(" "),
        },
      })),
    };
  },
};
export const INDICATOR: DaisyComponentDefinition = {
  id: "indicator",
  label: "Indicator",
  category: "Layout",
  tag: "div",
  rootClass: "indicator",
  container: true,
  fields: [
    { key: "badge", label: "Indicator text", kind: "text", default: "New" },
    {
      key: "position",
      label: "Position",
      kind: "select",
      default: "top-end",
      options: [
        "top-start",
        "top-center",
        "top-end",
        "middle-start",
        "middle-end",
        "bottom-start",
        "bottom-center",
        "bottom-end",
      ],
      classMap: {
        "top-start": "indicator-top indicator-start",
        "top-center": "indicator-top indicator-center",
        "top-end": "indicator-top indicator-end",
        "middle-start": "indicator-middle indicator-start",
        "middle-end": "indicator-middle indicator-end",
        "bottom-start": "indicator-bottom indicator-start",
        "bottom-center": "indicator-bottom indicator-center",
        "bottom-end": "indicator-bottom indicator-end",
      },
    },
    {
      key: "tone",
      label: "Color",
      kind: "select",
      default: "primary",
      options: ["neutral", "primary", "secondary", "accent", "success", "warning", "error"],
      classMap: {
        neutral: "badge-neutral",
        primary: "badge-primary",
        secondary: "badge-secondary",
        accent: "badge-accent",
        success: "badge-success",
        warning: "badge-warning",
        error: "badge-error",
      },
    },
  ],
  build(node, classes, children) {
    const badgeClasses = classes.filter(
      (c) => c.startsWith("indicator-") || c.startsWith("badge-"),
    );
    return {
      tag: "div",
      attrs: { class: "indicator" },
      children: [
        {
          tag: "span",
          attrs: { class: ["indicator-item badge", ...badgeClasses].join(" ") },
          children: [String(node.props.badge)],
        },
        ...children,
      ],
    };
  },
};
export const MASK: DaisyComponentDefinition = {
  id: "mask",
  label: "Mask",
  category: "Layout",
  tag: "img",
  rootClass: "mask",
  fields: [
    { key: "src", label: "Image", kind: "media", default: "", attribute: "src" },
    {
      key: "alt",
      label: "Alternative text",
      kind: "text",
      default: "Masked image",
      attribute: "alt",
    },
    {
      key: "shape",
      label: "Shape",
      kind: "select",
      default: "squircle",
      options: [
        "squircle",
        "heart",
        "hexagon",
        "hexagon-2",
        "decagon",
        "pentagon",
        "diamond",
        "star",
        "star-2",
        "circle",
        "triangle",
        "triangle-2",
        "triangle-3",
        "triangle-4",
      ],
      classMap: {
        triangle: "mask-triangle",
        "triangle-2": "mask-triangle-2",
        "triangle-3": "mask-triangle-3",
        "triangle-4": "mask-triangle-4",
        squircle: "mask-squircle",
        heart: "mask-heart",
        hexagon: "mask-hexagon",
        "hexagon-2": "mask-hexagon-2",
        decagon: "mask-decagon",
        pentagon: "mask-pentagon",
        diamond: "mask-diamond",
        star: "mask-star",
        "star-2": "mask-star-2",
        circle: "mask-circle",
      },
    },
    {
      key: "half",
      label: "Half",
      kind: "select",
      default: "none",
      options: ["none", "half-1", "half-2"],
      optionLabels: { none: "Whole", "half-1": "Left half", "half-2": "Right half" },
      classMap: { none: "", "half-1": "mask-half-1", "half-2": "mask-half-2" },
    },
    {
      key: "size",
      label: "Size",
      kind: "select",
      default: "md",
      options: ["sm", "md", "lg"],
      classMap: { sm: "w-24", md: "w-48", lg: "w-72" },
    },
  ],
  build(node, classes) {
    // No picture: a neutral block with the same shape, so no file is requested.
    if (!String(node.props.src ?? "").trim())
      return {
        tag: "div",
        attrs: {
          class: [...classes, "bg-neutral"].join(" "),
          role: "img",
          "aria-label": String(node.props.alt),
        },
        children: [],
      };
    return {
      tag: "img",
      attrs: {
        class: classes.join(" "),
        src: safeHref(node.props.src),
        alt: String(node.props.alt),
        loading: "lazy",
      },
      children: [],
    };
  },
};
export const BROWSER_MOCKUP: DaisyComponentDefinition = {
  id: "browser-mockup",
  label: "Browser Mockup",
  category: "Marketing",
  tag: "div",
  rootClass: "mockup-browser border border-base-300",
  container: true,
  fields: [
    { key: "url", label: "Address", kind: "text", default: "https://emdash.dev" },
    { key: "content", label: "Content", kind: "textarea", default: "Your page preview" },
  ],
  build(node, classes, children) {
    return {
      tag: "div",
      attrs: { class: classes.join(" ") },
      children: [
        {
          tag: "div",
          attrs: { class: "mockup-browser-toolbar" },
          children: [{ tag: "div", attrs: { class: "input" }, children: [String(node.props.url)] }],
        },
        {
          tag: "div",
          attrs: { class: "grid place-content-center border-t border-base-300 h-64" },
          children: [String(node.props.content), ...children],
        },
      ],
    };
  },
};
export const PHONE_MOCKUP: DaisyComponentDefinition = {
  id: "phone-mockup",
  label: "Phone Mockup",
  category: "Marketing",
  tag: "div",
  rootClass: "mockup-phone",
  container: true,
  fields: [
    { key: "camera", label: "Show camera", kind: "boolean", default: true },
    { key: "content", label: "Content", kind: "textarea", default: "Mobile preview" },
  ],
  build(node, classes, children) {
    return {
      tag: "div",
      attrs: { class: classes.join(" ") },
      children: [
        ...(node.props.camera
          ? [{ tag: "div", attrs: { class: "mockup-phone-camera" }, children: [] } as DaisyVNode]
          : []),
        {
          tag: "div",
          attrs: { class: "mockup-phone-display" },
          children: [
            {
              tag: "div",
              attrs: { class: "grid place-content-center bg-base-200 h-full" },
              children: [String(node.props.content), ...children],
            },
          ],
        },
      ],
    };
  },
};
export const CODE_MOCKUP: DaisyComponentDefinition = {
  id: "code-mockup",
  label: "Code Mockup",
  category: "Marketing",
  tag: "pre",
  rootClass: "mockup-code",
  fields: [
    { key: "code", label: "Code", kind: "textarea", default: "npm install @perkyzz/emvb-daisyui" },
    { key: "prefix", label: "Prompt", kind: "text", default: "$" },
    {
      key: "tone",
      label: "Tone",
      kind: "select",
      default: "neutral",
      options: ["neutral", "primary", "secondary", "accent"],
      classMap: {
        neutral: "bg-neutral text-neutral-content",
        primary: "bg-primary text-primary-content",
        secondary: "bg-secondary text-secondary-content",
        accent: "bg-accent text-accent-content",
      },
    },
  ],
  build(node, classes) {
    return {
      tag: "div",
      attrs: { class: classes.join(" ") },
      children: [
        {
          tag: "pre",
          attrs: { "data-prefix": String(node.props.prefix) },
          children: [{ tag: "code", attrs: {}, children: [String(node.props.code)] }],
        },
      ],
    };
  },
};
// Lays children side by side on wide screens and stacks them on phones. The recipes use it for
// rows of cards and numbers; the Columns setting is the number of columns on a wide screen.
export const COLUMNS: DaisyComponentDefinition = {
  id: "columns",
  label: "Columns",
  category: "Layout",
  tag: "div",
  rootClass: "grid w-full gap-4",
  container: true,
  fields: [
    {
      key: "columns",
      label: "Columns on a wide screen",
      kind: "select",
      default: "3",
      options: ["2", "3", "4"],
      classMap: { "2": "md:grid-cols-2", "3": "md:grid-cols-3", "4": "md:grid-cols-4" },
    },
  ],
  build(_node, classes, children) {
    return { tag: "div", attrs: { class: classes.join(" ") }, children };
  },
};

export const LAYOUT_MARKETING_DAISY_COMPONENTS = [
  HERO,
  STACK,
  DIVIDER,
  JOIN,
  INDICATOR,
  MASK,
  BROWSER_MOCKUP,
  PHONE_MOCKUP,
  CODE_MOCKUP,
] as const;
