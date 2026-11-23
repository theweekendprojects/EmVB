import type { ExtensionManifest } from "../../core/index.ts";

/** Admin-side cache of manifests from editor/config (no render functions). */
let cache: readonly ExtensionManifest[] = [];

export function setAdminExtensionManifests(manifests: readonly ExtensionManifest[]): void {
  cache = manifests;
}

/** Element type to label, for the Layers panel. Built from the manifests the editor holds. */
export function extensionLabelsOf(manifests: readonly ExtensionManifest[]): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const ext of manifests) for (const el of ext.elements) labels[el.type] = el.label;
  return labels;
}

/** The Add panel heading for extension tiles: the extension's own name, or "Extensions" when unclear. */
export function adminExtensionGroupTitle(): string {
  const names = cache.map((ext) => ext.label).filter((name) => name.length > 0);
  const [only] = names;
  return names.length === 1 && only !== undefined ? only : "Extensions";
}

/** The label an extension element shows in the editor (its chip and Layers row), or undefined. */
export function adminExtensionLabel(type: string): string | undefined {
  for (const ext of cache) {
    const el = ext.elements.find((e) => e.type === type);
    if (el) return el.label;
  }
  return undefined;
}
export function adminExtensionDefaults(type: string): Record<string, unknown> | undefined {
  for (const ext of cache) {
    const el = ext.elements.find((e) => e.type === type);
    if (el) return { ...el.defaults };
  }
  return undefined;
}

/** W-933: whether the site registered the extension for `type`, as the editor's manifests say. */
export const adminExtensionInstalled = (type: string): boolean =>
  cache.some((ext) => ext.elements.some((e) => e.type === type));
