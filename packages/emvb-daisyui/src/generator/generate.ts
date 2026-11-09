import { componentClasses, mergeClasses } from "../render/classes.ts";
import type {
  DaisyComponentDefinition,
  DaisyComponentNode,
  GeneratedDaisyComponent,
  VNode,
} from "../types.ts";

function fieldDefaults(
  definition: DaisyComponentDefinition,
): Record<string, string | number | boolean> {
  return Object.fromEntries(definition.fields.map((field) => [field.key, field.default]));
}

function fieldAttrs(
  definition: DaisyComponentDefinition,
  node: DaisyComponentNode,
): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const field of definition.fields) {
    if (!field.attribute) continue;
    const value = node.props[field.key] ?? field.default;
    if (typeof value === "boolean") {
      if (value)
        attrs[field.attribute] = field.attribute.startsWith("aria-") ? "true" : field.attribute;
    } else if (value !== "") attrs[field.attribute] = String(value);
  }
  if (definition.role) attrs.role = definition.role;
  return attrs;
}

function textChildren(definition: DaisyComponentDefinition, node: DaisyComponentNode): string[] {
  return definition.fields
    .filter((field) => field.textContent)
    .map((field) => String(node.props[field.key] ?? field.default));
}

export function generateComponent(definition: DaisyComponentDefinition): GeneratedDaisyComponent {
  validateDefinition(definition);
  return {
    definition,
    descriptor: {
      type: "provider",
      provider: "daisyui",
      component: definition.id,
      name: definition.label,
      group: "content",
      defaultTab: "content",
      fields: definition.fields.map((field) => ({
        key: field.key,
        kind: field.kind,
        label: field.label,
        options: field.options?.map((value) => ({ value, label: titleCase(value) })),
      })),
    },
    defaults: () => ({
      type: "provider",
      provider: "daisyui",
      component: definition.id,
      props: fieldDefaults(definition),
      ...(definition.container ? { children: [] } : {}),
    }),
    build(node, attrs = {}, children: VNode[] = []) {
      const classes = componentClasses(definition, node.props);
      if (definition.build) return definition.build(node, classes, children);
      return {
        tag: definition.tag,
        attrs: {
          ...attrs,
          ...fieldAttrs(definition, node),
          class: mergeClasses(attrs.class, classes.join(" ")),
        },
        children: [...textChildren(definition, node), ...children],
      };
    },
  };
}

export function validateDefinition(definition: DaisyComponentDefinition): void {
  if (!/^[a-z][a-z0-9-]*$/.test(definition.id))
    throw new Error(`Invalid component id: ${definition.id}`);
  if (!definition.rootClass.trim()) throw new Error(`${definition.id}: rootClass is required`);
  const keys = new Set<string>();
  for (const field of definition.fields) {
    if (keys.has(field.key)) throw new Error(`${definition.id}: duplicate field ${field.key}`);
    keys.add(field.key);
    if (field.options && !field.options.includes(String(field.default)))
      throw new Error(`${definition.id}.${field.key}: default must be an option`);
    if (field.classMap) {
      for (const option of field.options ?? [])
        if (!(option in field.classMap))
          throw new Error(`${definition.id}.${field.key}: missing class for ${option}`);
    }
  }
}

const titleCase = (value: string) =>
  value.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
