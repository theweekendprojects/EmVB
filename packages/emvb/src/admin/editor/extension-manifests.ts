import type { ExtensionManifest } from "../../core/index.ts";
import { setContainerExtensionTypes } from "../../core/extensions/containers.ts";

/** Admin-side cache of manifests from editor/config (no render functions). */
let cache: readonly ExtensionManifest[] = [];

export function setAdminExtensionManifests(manifests: readonly ExtensionManifest[]): void {
  cache = manifests;
  setContainerExtensionTypes(manifests);
}

/** The name a Layers row shows for an extension element: its label, not its stored type. */
export function adminExtensionLabel(type: string): string | undefined {
  for (const ext of cache) {
    const el = ext.elements.find((e) => e.type === type);
    if (el) return el.label;
  }
  return undefined;
}

/** The Add panel heading for extension tiles: the extension's own name, or "Extensions" when unclear. */
export function adminExtensionGroupTitle(): string {
  const names = cache.map((ext) => ext.label).filter((name) => name.length > 0);
  const [only] = names;
  return names.length === 1 && only !== undefined ? only : "Extensions";
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
