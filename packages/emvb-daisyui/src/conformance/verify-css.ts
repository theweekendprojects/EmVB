import { DAISYUI_CONFORMANCE } from "./manifest.ts";

export interface CssConformanceResult { ok: boolean; checked: number; missing: string[]; }

const selectorPattern = (selector: string): RegExp => new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9_-])`);

/** Verifies required selectors in CSS actually compiled by the pinned official Tailwind+daisyUI packages. */
export function verifyCompiledCss(css: string): CssConformanceResult {
  const missing = DAISYUI_CONFORMANCE.requiredSelectors.filter((selector) => !selectorPattern(selector).test(css));
  return { ok: missing.length === 0, checked: DAISYUI_CONFORMANCE.requiredSelectors.length, missing };
}
