import { DAISY_COMPONENT_CATALOG } from "../catalog/index.ts";
import { DAISYUI_CONFORMANCE, isVerifiedDaisyComponent } from "./manifest.ts";

export interface CatalogSupportEntry { id: string; label: string; category: string; status: "verified" | "experimental"; fields: string[]; rootClass: string; }
export interface CatalogSupportReport { daisyuiVersion: string; tailwindcssVersion: string; generatedAt: string; verified: number; experimental: number; components: CatalogSupportEntry[]; }

export function catalogSupportReport(now = new Date()): CatalogSupportReport {
  const components = DAISY_COMPONENT_CATALOG.map((definition) => ({ id: definition.id, label: definition.label, category: definition.category, status: isVerifiedDaisyComponent(definition.id) ? "verified" as const : "experimental" as const, fields: definition.fields.map((field) => field.key), rootClass: definition.rootClass }));
  return { daisyuiVersion: DAISYUI_CONFORMANCE.daisyuiVersion, tailwindcssVersion: DAISYUI_CONFORMANCE.tailwindcssVersion, generatedAt: now.toISOString(), verified: components.filter((item) => item.status === "verified").length, experimental: components.filter((item) => item.status === "experimental").length, components };
}
