import type { ProviderComponentDescriptor } from "@perkyzz/emvb-provider-api";
import { OFFICIAL_DAISYUI_COMPONENTS } from "../conformance/official-inventory.ts";
import { daisyUIProvider } from "../provider.ts";
export type EditorIntegrationMode = "direct" | "compound" | "textless";
export const COMPOUND_EDITOR_COMPONENTS = ["accordion", "carousel", "menu", "table", "tabs"] as const;
export const INTENTIONALLY_TEXTLESS_COMPONENTS = ["aura", "divider", "indicator", "join", "loading", "mask", "skeleton", "stack", "status", "swap", "theme-controller"] as const;
const editableKinds = new Set(["text", "textarea", "number", "select", "boolean", "href"]);
export interface EditorIntegrationAudit { id: string; mode: EditorIntegrationMode; ok: boolean; reason: string; }
export function editorIntegrationAudit(): EditorIntegrationAudit[] {
  return OFFICIAL_DAISYUI_COMPONENTS.map(({ id }) => {
    const descriptor: ProviderComponentDescriptor | undefined = daisyUIProvider.components.get(id)?.descriptor;
    if (!descriptor) return { id, mode: "direct", ok: false, reason: "Component is not registered." };
    const unsupported = descriptor.fields.filter((field) => !editableKinds.has(field.kind));
    if (unsupported.length) return { id, mode: "direct", ok: false, reason: `Unsupported fields: ${unsupported.map((field) => field.kind).join(", ")}.` };
    if ((COMPOUND_EDITOR_COMPONENTS as readonly string[]).includes(id)) return { id, mode: "compound", ok: true, reason: "Managed by the typed compound editor." };
    if ((INTENTIONALLY_TEXTLESS_COMPONENTS as readonly string[]).includes(id)) return { id, mode: "textless", ok: true, reason: "Component has no required user-facing text." };
    const text = descriptor.fields.some((field) => field.kind === "text" || field.kind === "textarea" || field.kind === "href");
    return { id, mode: "direct", ok: text, reason: text ? "Direct editor fields are available." : "No direct text/content field." };
  });
}
