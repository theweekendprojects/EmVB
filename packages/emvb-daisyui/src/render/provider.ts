import { generateComponent } from "../generator/generate.ts";
import type {
  ComponentProvider,
  DaisyComponentDefinition,
  DaisyComponentNode,
  GeneratedDaisyComponent,
  DaisyVNode,
} from "../types.ts";
import { isCompoundPart, renderCompoundNode } from "../compound/index.ts";
import { nodeForRender } from "../runtime/index.ts";
import { themeAttributes } from "../themes/index.ts";
import { upgradeLegacyDaisyNode } from "../legacy.ts";

export function createDaisyUIProvider(
  definitions: readonly DaisyComponentDefinition[],
  recipes: ComponentProvider["recipes"] = [],
): ComponentProvider {
  const components = new Map<string, GeneratedDaisyComponent>(
    definitions.map((definition) => [definition.id, generateComponent(definition)]),
  );
  return {
    id: "daisyui",
    version: "0.1.0",
    providerApiVersion: 1,
    nodeVersion: 1,
    label: "daisyUI",
    nodeType: "provider",
    components,
    recipes,
    legacyNodeTypes: { daisy: upgradeLegacyDaisyNode },
    collections: [
      {
        parentComponent: "menu",
        itemComponent: "menu-item",
        itemLabel: "Menu item",
        fields: ["label", "href", "disabled"],
        createItem: (id, index) => ({
          id,
          type: "provider",
          provider: "daisyui",
          component: "menu-item",
          props: { label: `Item ${index + 1}`, href: "#", disabled: false },
          children: [],
        }),
      },
      {
        parentComponent: "tabs",
        itemComponent: "tab-item",
        itemLabel: "Tab",
        fields: ["label", "selected"],
        createItem: (id, index) => ({
          id,
          type: "provider",
          provider: "daisyui",
          component: "tab-item",
          props: { label: `Tab ${index + 1}`, selected: index === 0 },
          children: [],
        }),
      },
      {
        parentComponent: "accordion",
        itemComponent: "accordion-item",
        itemLabel: "Accordion item",
        fields: ["label", "defaultOpen"],
        createItem: (id, index) => ({
          id,
          type: "provider",
          provider: "daisyui",
          component: "accordion-item",
          props: { label: `Question ${index + 1}`, defaultOpen: false },
          children: [],
        }),
      },
      {
        parentComponent: "carousel",
        itemComponent: "carousel-item",
        itemLabel: "Slide",
        fields: ["label"],
        createItem: (id, index) => ({
          id,
          type: "provider",
          provider: "daisyui",
          component: "carousel-item",
          props: { label: `Slide ${index + 1}` },
          children: [],
        }),
      },
      {
        parentComponent: "table",
        itemComponent: "table-row",
        itemLabel: "Row",
        fields: [],
        createItem: (id) => ({
          id,
          type: "provider",
          provider: "daisyui",
          component: "table-row",
          props: {},
          children: [
            {
              id: `${id}-cell`,
              type: "provider",
              provider: "daisyui",
              component: "table-cell",
              props: { text: "Cell" },
              children: [],
            },
          ],
        }),
      },
    ],
    acceptsChildren: (node) =>
      components.get(node.component)?.descriptor.container === true ||
      isCompoundPart(node.component),
    migrateNode: (node, context) => {
      if (context.fromVersion !== 1 || context.toVersion !== 1)
        throw new Error(
          `Unsupported daisyUI migration ${context.fromVersion} -> ${context.toVersion}`,
        );
      return structuredClone(node);
    },
    metaFields: [
      {
        key: "theme",
        kind: "select",
        label: "Theme",
        options: [
          { value: "", label: "Inherit page theme" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "corporate", label: "Corporate" },
          { value: "business", label: "Business" },
          { value: "cupcake", label: "Cupcake" },
        ],
      },
    ],
    cssEntryPoints: ["@perkyzz/emvb-daisyui/styles.css"],
    runtimeEntryPoints: ["@perkyzz/emvb-daisyui/runtime"],
    needsRuntime: (node) =>
      ["modal", "tabs", "drawer", "dropdown", "carousel", "countdown"].includes(node.component),
    // Do NOT force a page-level data-theme: that pinned daisyUI's `light` base (white) over the
    // host's own light/dark, so a dark site got a white EmVB region. Set data-theme on the wrapper
    // ONLY if a node explicitly asked for one via providerMeta.theme (handled per-node in core's
    // providerElement.build); otherwise inherit the document's theme (the host sets data-theme on
    // <html> to mirror the EmDash light/dark choice).
    rootAttributes: (nodes) => {
      const chosen = nodes
        .map((node) =>
          node.providerMeta && typeof node.providerMeta.theme === "string"
            ? node.providerMeta.theme
            : "",
        )
        .find((theme) => theme);
      return chosen ? themeAttributes(chosen) : {};
    },
    createNode(component, id) {
      const generated = components.get(component);
      if (!generated) throw new Error(`Unknown daisyUI component: ${component}`);
      return { id, providerVersion: 1, ...generated.defaults() };
    },
    render(
      node: DaisyComponentNode,
      attrs: Record<string, string> = {},
      children: DaisyVNode[] = [],
      context = { mode: "public" as const },
    ) {
      const prepared = nodeForRender(node, context);
      if (isCompoundPart(prepared.component)) return renderCompoundNode(prepared, children);
      const generated = components.get(prepared.component);
      if (!generated) throw new Error(`Unknown daisyUI component: ${node.component}`);
      return generated.build(prepared, attrs, children);
    },
  };
}
