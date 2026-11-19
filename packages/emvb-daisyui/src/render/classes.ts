import type { DaisyComponentDefinition, DaisyProps } from "../types.ts";

// Inline-level roots ignore auto margins, so they shrink to their content and centre as blocks.
// Everything else is block-level and centres with `mx-auto` alone.
const INLINE_ROOTS = new Set([
  "badge",
  "btn",
  "kbd",
  "status",
  "toggle",
  "checkbox",
  "radio",
  "swap",
  "rating",
  "radial-progress",
  "indicator",
]);

// Button shapes that set their own width or size and so must not get the natural-width override.
const SHAPED_BUTTONS = ["btn-block", "btn-wide", "btn-square", "btn-circle"];

export function componentClasses(
  definition: DaisyComponentDefinition,
  props: DaisyProps,
): string[] {
  const classes = [definition.rootClass];
  for (const field of definition.fields) {
    if (!field.classMap) continue;
    const value = String(props[field.key] ?? field.default);
    const className = field.classMap[value];
    if (className) classes.push(className);
  }
  // A button keeps its natural width unless its shape asks for full, square or round. A site-wide
  // `.btn { width: 100% }` rule otherwise stretches every button; the important flag wins over it.
  if (definition.rootClass === "btn" && !SHAPED_BUTTONS.some((c) => classes.includes(c)))
    classes.push("w-auto!");
  // Every daisyUI element is centred in its parent, with room above and below so stacked blocks
  // do not run into each other.
  if (INLINE_ROOTS.has(definition.rootClass)) classes.push("w-fit");
  classes.push("mx-auto", "my-4");
  return classes;
}

export function mergeClasses(...values: Array<string | undefined>): string {
  return [...new Set(values.flatMap((value) => value?.split(/\s+/).filter(Boolean) ?? []))].join(
    " ",
  );
}
