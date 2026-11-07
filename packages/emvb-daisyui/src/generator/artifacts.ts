import type { DaisyComponentDefinition } from "../types.ts";

export function generateSafelistCss(definitions: readonly DaisyComponentDefinition[]): string {
  const classes = new Set<string>();
  for (const definition of definitions) {
    classes.add(definition.rootClass);
    for (const field of definition.fields) for (const className of Object.values(field.classMap ?? {})) {
      for (const token of className.split(/\s+/)) if (token) classes.add(token);
    }
  }
  return `/* Generated. Ensures Tailwind discovers every allowlisted daisyUI class. */\n${[...classes].sort().map(className => `.${className} {}`).join("\n")}\n`;
}

export function generateGallery(definitions: readonly DaisyComponentDefinition[]): string {
  return JSON.stringify(definitions.map(definition => ({
    id: definition.id,
    label: definition.label,
    category: definition.category,
    defaults: Object.fromEntries(definition.fields.map(field => [field.key, field.default])),
  })), null, 2) + "\n";
}
