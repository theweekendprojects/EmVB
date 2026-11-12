import type { DaisyComponentDefinition, VNode } from "../types.ts";
import { safeHref } from "../render/href.ts";

const sizes = ["xs", "sm", "md", "lg", "xl"] as const;
const sizeMap = (prefix: string) =>
  Object.fromEntries(sizes.map((size) => [size, `${prefix}-${size}`]));
const lines = (value: unknown) =>
  String(value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
const navItem = (label: string, href = "#"): VNode => ({
  tag: "li",
  attrs: {},
  children: [{ tag: "a", attrs: { href: safeHref(href) }, children: [label] }],
});

export const NAVBAR: DaisyComponentDefinition = {
  id: "navbar",
  label: "Navbar",
  category: "Navigation",
  tag: "nav",
  rootClass: "navbar",
  role: "navigation",
  container: true,
  fields: [
    {
      key: "ariaLabel",
      label: "Navigation label",
      kind: "text",
      default: "Primary navigation",
      attribute: "aria-label",
    },
    { key: "brand", label: "Brand", kind: "text", default: "EmDash" },
    { key: "brandHref", label: "Brand link", kind: "href", default: "/" },
    {
      key: "items",
      label: "Items, Label|URL per line",
      kind: "textarea",
      default: "Home|/\nAbout|/about\nContact|/contact",
    },
    {
      key: "position",
      label: "Position",
      kind: "select",
      default: "static",
      options: ["static", "sticky"],
      classMap: { static: "", sticky: "sticky top-0 z-50" },
    },
  ],
  build(node, classes, children) {
    const items = lines(node.props.items).map((entry) => {
      const [label, href = "#"] = entry.split("|");
      return navItem(label || "Link", href || "#");
    });
    return {
      tag: "nav",
      attrs: {
        class: classes.filter(Boolean).join(" "),
        "aria-label": String(node.props.ariaLabel),
      },
      children: [
        {
          tag: "div",
          attrs: { class: "navbar-start" },
          children: [
            {
              tag: "a",
              attrs: { class: "btn btn-ghost text-xl", href: safeHref(node.props.brandHref) },
              children: [String(node.props.brand)],
            },
          ],
        },
        {
          tag: "div",
          attrs: { class: "navbar-center hidden lg:flex" },
          children: [{ tag: "ul", attrs: { class: "menu menu-horizontal px-1" }, children: items }],
        },
        { tag: "div", attrs: { class: "navbar-end" }, children },
      ],
    };
  },
};

export const MENU: DaisyComponentDefinition = {
  id: "menu",
  label: "Menu",
  category: "Navigation",
  tag: "ul",
  rootClass: "menu",
  role: "navigation",
  fields: [
    {
      key: "ariaLabel",
      label: "Menu label",
      kind: "text",
      default: "Menu",
      attribute: "aria-label",
    },
    {
      key: "items",
      label: "Items, Label|URL per line",
      kind: "textarea",
      default: "Dashboard|/dashboard\nSettings|/settings",
    },
    {
      key: "direction",
      label: "Direction",
      kind: "select",
      default: "vertical",
      options: ["vertical", "horizontal"],
      classMap: { vertical: "menu-vertical", horizontal: "menu-horizontal" },
    },
    {
      key: "size",
      label: "Size",
      kind: "select",
      default: "md",
      options: sizes,
      classMap: sizeMap("menu"),
    },
  ],
  build(node, classes) {
    return {
      tag: "ul",
      attrs: { class: classes.join(" "), "aria-label": String(node.props.ariaLabel) },
      children: lines(node.props.items).map((entry) => {
        const [label, href = "#"] = entry.split("|");
        return navItem(label || "Link", href || "#");
      }),
    };
  },
};

export const BREADCRUMBS: DaisyComponentDefinition = {
  id: "breadcrumbs",
  label: "Breadcrumbs",
  category: "Navigation",
  tag: "nav",
  rootClass: "breadcrumbs",
  role: "navigation",
  fields: [
    {
      key: "ariaLabel",
      label: "Breadcrumb label",
      kind: "text",
      default: "Breadcrumb",
      attribute: "aria-label",
    },
    {
      key: "items",
      label: "Items, Label|URL per line",
      kind: "textarea",
      default: "Home|/\nDocuments|/documents\nCurrent|",
    },
  ],
  build(node, classes) {
    const items = lines(node.props.items);
    return {
      tag: "nav",
      attrs: { class: classes.join(" "), "aria-label": String(node.props.ariaLabel) },
      children: [
        {
          tag: "ul",
          attrs: {},
          children: items.map((entry, index) => {
            const [label, href = ""] = entry.split("|");
            return {
              tag: "li",
              attrs: index === items.length - 1 ? { "aria-current": "page" } : {},
              children: href
                ? [{ tag: "a", attrs: { href: safeHref(href) }, children: [label || "Page"] }]
                : [label || "Page"],
            };
          }),
        },
      ],
    };
  },
};

export const PAGINATION: DaisyComponentDefinition = {
  id: "pagination",
  label: "Pagination",
  category: "Navigation",
  tag: "nav",
  rootClass: "join",
  role: "navigation",
  fields: [
    {
      key: "ariaLabel",
      label: "Pagination label",
      kind: "text",
      default: "Pagination",
      attribute: "aria-label",
    },
    { key: "pages", label: "Page count", kind: "number", default: 5 },
    { key: "current", label: "Current page", kind: "number", default: 1 },
    { key: "baseHref", label: "Base URL", kind: "href", default: "?page=" },
    {
      key: "size",
      label: "Size",
      kind: "select",
      default: "md",
      options: sizes,
      classMap: sizeMap("join"),
    },
  ],
  build(node, classes) {
    const pages = Math.min(20, Math.max(1, Number(node.props.pages)));
    const current = Math.min(pages, Math.max(1, Number(node.props.current)));
    const children: VNode[] = [];
    for (let page = 1; page <= pages; page++)
      children.push({
        tag: "a",
        attrs: {
          class: `join-item btn${page === current ? " btn-active" : ""}`,
          href: safeHref(`${node.props.baseHref}${page}`),
          ...(page === current ? { "aria-current": "page" } : {}),
        },
        children: [String(page)],
      });
    return {
      tag: "nav",
      attrs: { class: classes.join(" "), "aria-label": String(node.props.ariaLabel) },
      children,
    };
  },
};

export const STEPS: DaisyComponentDefinition = {
  id: "steps",
  label: "Steps",
  category: "Navigation",
  tag: "ol",
  rootClass: "steps",
  fields: [
    {
      key: "items",
      label: "Steps, one per line",
      kind: "textarea",
      default: "Register\nChoose plan\nPurchase\nReceive product",
    },
    { key: "current", label: "Current step", kind: "number", default: 2 },
    {
      key: "direction",
      label: "Direction",
      kind: "select",
      default: "horizontal",
      options: ["horizontal", "vertical"],
      classMap: { horizontal: "steps-horizontal", vertical: "steps-vertical" },
    },
  ],
  build(node, classes) {
    const items = lines(node.props.items);
    const current = Math.min(items.length, Math.max(0, Number(node.props.current)));
    return {
      tag: "ol",
      attrs: { class: classes.join(" "), "aria-label": "Progress" },
      children: items.map((label, index) => ({
        tag: "li",
        attrs: {
          class: `step${index < current ? " step-primary" : ""}`,
          ...(index + 1 === current ? { "aria-current": "step" } : {}),
        },
        children: [label],
      })),
    };
  },
};

export const DOCK: DaisyComponentDefinition = {
  id: "dock",
  label: "Dock",
  category: "Navigation",
  tag: "nav",
  rootClass: "dock",
  role: "navigation",
  fields: [
    {
      key: "ariaLabel",
      label: "Dock label",
      kind: "text",
      default: "Mobile navigation",
      attribute: "aria-label",
    },
    {
      key: "items",
      label: "Items, Label|URL per line",
      kind: "textarea",
      default: "Home|/\nSearch|/search\nProfile|/profile",
    },
    { key: "active", label: "Active label", kind: "text", default: "Home" },
    {
      key: "size",
      label: "Size",
      kind: "select",
      default: "md",
      options: sizes,
      classMap: sizeMap("dock"),
    },
  ],
  build(node, classes) {
    return {
      tag: "nav",
      attrs: { class: classes.join(" "), "aria-label": String(node.props.ariaLabel) },
      children: lines(node.props.items).map((entry) => {
        const [label, href = "#"] = entry.split("|");
        return {
          tag: "a",
          attrs: {
            href: safeHref(href),
            class: label === String(node.props.active) ? "dock-active" : "",
            ...(label === String(node.props.active) ? { "aria-current": "page" } : {}),
          },
          children: [{ tag: "span", attrs: { class: "dock-label" }, children: [label || "Link"] }],
        };
      }),
    };
  },
};

export const FOOTER: DaisyComponentDefinition = {
  id: "footer",
  label: "Footer",
  category: "Navigation",
  tag: "footer",
  rootClass: "footer",
  role: "contentinfo",
  container: true,
  fields: [
    { key: "brand", label: "Brand", kind: "text", default: "EmDash" },
    {
      key: "description",
      label: "Description",
      kind: "textarea",
      default: "Visual publishing for modern teams.",
    },
    {
      key: "links",
      label: "Links, Label|URL per line",
      kind: "textarea",
      default: "About|/about\nContact|/contact\nPrivacy|/privacy",
    },
    {
      key: "layout",
      label: "Layout",
      kind: "select",
      default: "horizontal",
      options: ["horizontal", "vertical", "center"],
      classMap: {
        horizontal: "sm:footer-horizontal",
        vertical: "footer-vertical",
        center: "footer-center",
      },
    },
  ],
  build(node, classes, children) {
    return {
      tag: "footer",
      attrs: { class: classes.join(" "), role: "contentinfo" },
      children: [
        {
          tag: "aside",
          attrs: {},
          children: [
            { tag: "strong", attrs: {}, children: [String(node.props.brand)] },
            { tag: "p", attrs: {}, children: [String(node.props.description)] },
          ],
        },
        {
          tag: "nav",
          attrs: { "aria-label": "Footer links" },
          children: lines(node.props.links).map((entry) => {
            const [label, href = "#"] = entry.split("|");
            return {
              tag: "a",
              attrs: { class: "link link-hover", href: safeHref(href) },
              children: [label || "Link"],
            };
          }),
        },
        ...children,
      ],
    };
  },
};

export const NAVIGATION_DAISY_COMPONENTS = [
  NAVBAR,
  MENU,
  BREADCRUMBS,
  PAGINATION,
  STEPS,
  DOCK,
  FOOTER,
] as const;
