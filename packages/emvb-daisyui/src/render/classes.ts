import type { DaisyComponentDefinition, DaisyProps } from "../types.ts";

export function componentClasses(definition: DaisyComponentDefinition, props: DaisyProps): string[] {
  const classes = [definition.rootClass];
  for (const field of definition.fields) {
    if (!field.classMap) continue;
    const value = String(props[field.key] ?? field.default);
    const className = field.classMap[value];
    if (className) classes.push(className);
  }
  return classes;
}

export function mergeClasses(...values: Array<string | undefined>): string {
  return [...new Set(values.flatMap(value => value?.split(/\s+/).filter(Boolean) ?? []))].join(" ");
}
