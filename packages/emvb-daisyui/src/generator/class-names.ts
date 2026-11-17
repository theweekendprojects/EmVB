import type { DaisyComponentDefinition } from "../types.ts";
import { DIGITS_2_CLASS, VALUE_CLASS_NAMES } from "../catalog/value-class.ts";

/**
 * Every class name the catalog can emit: each component's root class and every option's class map
 * value. Tailwind only generates classes it finds written out in the source, and the option classes
 * are built from templates, so the stylesheet would miss them. Writing this list out as literal
 * strings in `src/catalog/class-names.ts` puts every name in front of the scanner.
 */
export function catalogClassNames(catalog: readonly DaisyComponentDefinition[]): string[] {
  const names = new Set<string>();
  for (const definition of catalog) {
    for (const token of definition.rootClass.split(/\s+/)) if (token) names.add(token);
    for (const field of definition.fields) {
      if (!field.classMap) continue;
      for (const value of Object.values(field.classMap))
        for (const token of String(value).split(/\s+/)) if (token) names.add(token);
    }
  }
  // Classes a build function adds itself rather than through an option.
  for (const name of VALUE_CLASS_NAMES) names.add(name);
  names.add(DIGITS_2_CLASS);
  return [...names].toSorted();
}

/** The source text of `src/catalog/class-names.ts` for a catalog. */
export function classNamesModule(names: readonly string[]): string {
  const lines = names.map((name) => `  ${JSON.stringify(name)},`).join("\n");
  return `// Generated from the catalog by \`bun run --cwd packages/emvb-daisyui classes:write\`.
// Tailwind scans this file so every option class is generated. Do not edit by hand.
export const CATALOG_CLASS_NAMES = [
${lines}
] as const;
`;
}
