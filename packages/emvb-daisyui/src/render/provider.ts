import { generateComponent } from "../generator/generate.ts";
import type {
  ComponentProvider,
  DaisyComponentDefinition,
  DaisyComponentNode,
  GeneratedDaisyComponent,
  VNode,
} from "../types.ts";
import { isCompoundPart, renderCompoundNode } from "../compound/index.ts";
import { nodeForRender } from "../runtime/index.ts";
import { themeAttributes } from "../themes/index.ts";

export function createDaisyUIProvider(
  definitions: readonly DaisyComponentDefinition[],
  recipes: ComponentProvider["recipes"] = [],
): ComponentProvider {
  const components = new Map<string, GeneratedDaisyComponent>(
    definitions.map((definition) => [definition.id, generateComponent(definition)]),
  );
  return {
    id: "daisyui",
    label: "daisyUI",
    nodeType: "daisy",
    components,
    recipes,
    cssEntryPoints: ["@perkyzz/emvb-daisyui/styles.css"],
    runtimeEntryPoints: ["@perkyzz/emvb-daisyui/runtime"],
    needsRuntime: (node) => ["modal", "tabs", "drawer", "dropdown", "carousel"].includes(node.component),
    // Do NOT force a page-level data-theme: that pinned daisyUI's `light` base (white) over the
    // host's own light/dark, so a dark site got a white EmVB region. Set data-theme on the wrapper
    // ONLY if a node explicitly asked for one via providerMeta.theme (handled per-node in core's
    // providerElement.build); otherwise inherit the document's theme (the host sets data-theme on
    // <html> to mirror the EmDash light/dark choice).
    rootAttributes: (nodes) => {
      const chosen = nodes
        .map((node) => (node.providerMeta && typeof node.providerMeta.theme === "string" ? node.providerMeta.theme : ""))
        .find((theme) => theme);
      return chosen ? themeAttributes(chosen) : {};
    },
    createNode(component, id) {
      const generated = components.get(component);
      if (!generated) throw new Error(`Unknown daisyUI component: ${component}`);
      return { id, ...generated.defaults() };
    },
    render(
      node: DaisyComponentNode,
      attrs: Record<string, string> = {},
      children: VNode[] = [],
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
