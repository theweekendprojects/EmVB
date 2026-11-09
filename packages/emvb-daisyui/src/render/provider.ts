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
