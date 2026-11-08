import { generateComponent } from "../generator/generate.ts";
import type { ComponentProvider, DaisyComponentDefinition, DaisyComponentNode, GeneratedDaisyComponent, VNode } from "../types.ts";

export function createDaisyUIProvider(definitions: readonly DaisyComponentDefinition[]): ComponentProvider {
  const components = new Map<string, GeneratedDaisyComponent>(definitions.map(definition => [definition.id, generateComponent(definition)]));
  return {
    id: "daisyui",
    label: "daisyUI",
    nodeType: "daisy",
    components,
    cssEntryPoints: ["@perkyzz/emvb-daisyui/styles.css"],
    createNode(component, id) {
      const generated = components.get(component);
      if (!generated) throw new Error(`Unknown daisyUI component: ${component}`);
      return { id, ...generated.defaults() };
    },
    render(node: DaisyComponentNode, attrs: Record<string, string> = {}, children: VNode[] = []) {
      const generated = components.get(node.component);
      if (!generated) throw new Error(`Unknown daisyUI component: ${node.component}`);
      return generated.build(node, attrs, children);
    },
  };
}
