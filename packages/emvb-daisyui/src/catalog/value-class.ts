// Countdown and radial progress need a per-instance CSS variable (`--value`). Inline `style` is
// refused by the public allowlist (W-091), so the first paint carries the value as an
// arbitrary-property class. Tailwind only generates classes it finds as literals, so every value up
// to VALUE_MAX is listed in `class-names.ts` (written by `classes:write`).
// ponytail: classes stop at 100. Countdown values above that are set by the runtime script
// (`data-daisy-value` / `data-daisy-unit`), which is not limited. Raising VALUE_MAX costs ~30 bytes
// of CSS per step.
const VALUE_MAX = 100;

/** Two-digit display for a countdown unit (`--digits`), written out for the scanner. */
export const DIGITS_2_CLASS = "[--digits:2]";

export function valueClass(value: number): string {
  const whole = Number.isFinite(value) ? Math.round(Math.min(VALUE_MAX, Math.max(0, value))) : 0;
  return `[--value:${whole}]`;
}

export const VALUE_CLASS_NAMES: readonly string[] = Array.from({ length: VALUE_MAX + 1 }, (_, n) =>
  valueClass(n),
);
