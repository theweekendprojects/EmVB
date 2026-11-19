import type { DaisyComponentDefinition } from "../types.ts";

// Utilities the renderer adds itself (centring, mobile fallbacks). They are not in any catalog
// classMap, so the safelist must name them or Tailwind never emits their rules.
const RUNTIME_UTILITIES = [
  "mx-auto",
  "w-fit",
  "relative",
  "text-start",
  "text-end",
  "p-4",
  "w-full",
  "max-w-md",
  "bg-base-300",
  "aspect-video",
  "max-w-xs",
  "flex",
  "items-center",
  "justify-center",
  "rounded-box",
  "text-base-content/60",
  "my-4",
  "opacity-60",
  "grid",
  "place-items-center",
  "size-24!",
  "flex",
  "items-center",
  "gap-2",
  "cursor-pointer",
  "step-neutral",
  "step-primary",
  "step-secondary",
  "step-accent",
  "step-info",
  "step-success",
  "step-warning",
  "step-error",
  "p-6",
  "bg-base-200",
  "bg-linear-to-br",
  "from-primary",
  "to-secondary",
  "bg-primary",
  "text-primary-content",
  "max-sm:timeline-vertical",
  "max-sm:megamenu-vertical",
];

export function generateSafelistCss(definitions: readonly DaisyComponentDefinition[]): string {
  const classes = new Set<string>(RUNTIME_UTILITIES);
  for (const definition of definitions) {
    classes.add(definition.rootClass);
    for (const field of definition.fields)
      for (const className of Object.values(field.classMap ?? {})) {
        for (const token of className.split(/\s+/)) if (token) classes.add(token);
      }
  }
  return `/* Generated. Ensures Tailwind discovers every allowlisted daisyUI class. */\n${[
    ...classes,
  ]
    .toSorted()
    .map((className) => `.${className} {}`)
    .join("\n")}\n`;
}

export function generateGallery(definitions: readonly DaisyComponentDefinition[]): string {
  return (
    JSON.stringify(
      definitions.map((definition) => ({
        id: definition.id,
        label: definition.label,
        category: definition.category,
        defaults: Object.fromEntries(definition.fields.map((field) => [field.key, field.default])),
      })),
      null,
      2,
    ) + "\n"
  );
}
