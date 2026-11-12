import { DAISY_COMPONENT_CATALOG } from "../catalog/index.ts";
import { DAISYUI_CONFORMANCE, isVerifiedDaisyComponent } from "./manifest.ts";
import { OFFICIAL_DAISYUI_COMPONENTS } from "./official-inventory.ts";

export type CatalogSupportStatus = "verified" | "experimental" | "missing";
export interface CatalogSupportEntry { id: string; label: string; category: string; icon: string; status: CatalogSupportStatus; fields: string[]; rootClass?: string; }
export interface CatalogSupportReport { daisyuiVersion: string; tailwindcssVersion: string; generatedAt: string; officialTotal: number; implemented: number; verified: number; experimental: number; missing: number; components: CatalogSupportEntry[]; }

export function catalogSupportReport(now = new Date()): CatalogSupportReport {
  const local = new Map(DAISY_COMPONENT_CATALOG.map((definition) => [definition.id, definition]));
  const components = OFFICIAL_DAISYUI_COMPONENTS.map((official): CatalogSupportEntry => {
    const definition = local.get(official.id);
    return { id: official.id, label: official.name, category: official.category, icon: official.icon, status: !definition ? "missing" : isVerifiedDaisyComponent(official.id) ? "verified" : "experimental", fields: definition?.fields.map((field) => field.key) ?? [], ...(definition ? { rootClass: definition.rootClass } : {}) };
  });
  const verified = components.filter((item) => item.status === "verified").length;
  const experimental = components.filter((item) => item.status === "experimental").length;
  const missing = components.filter((item) => item.status === "missing").length;
  return { daisyuiVersion: DAISYUI_CONFORMANCE.daisyuiVersion, tailwindcssVersion: DAISYUI_CONFORMANCE.tailwindcssVersion, generatedAt: now.toISOString(), officialTotal: components.length, implemented: verified + experimental, verified, experimental, missing, components };
}
