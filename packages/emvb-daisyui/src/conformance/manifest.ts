/**
 * Official-version conformance boundary for the first production-safe subset.
 * Components outside this list remain experimental until markup, CSS, a11y,
 * keyboard, editor/public parity, and upgrade fixtures all pass.
 */
export const DAISYUI_CONFORMANCE = {
  daisyuiVersion: "5.7.50",
  tailwindcssVersion: "4.1.17",
  catalogVersion: 2,
  verifiedComponents: [
    "button",
    "badge",
    "alert",
    "card",
    "input",
    "textarea",
    "select",
    "checkbox",
    "toggle",
    "progress",
  ],
  requiredSelectors: [
    ".btn",
    ".badge",
    ".alert",
    ".card",
    ".input",
    ".textarea",
    ".select",
    ".checkbox",
    ".toggle",
    ".progress",
  ],
} as const;

export type VerifiedDaisyComponentId = (typeof DAISYUI_CONFORMANCE.verifiedComponents)[number];
const VERIFIED = new Set<string>(DAISYUI_CONFORMANCE.verifiedComponents);
export const isVerifiedDaisyComponent = (id: string): id is VerifiedDaisyComponentId => VERIFIED.has(id);
