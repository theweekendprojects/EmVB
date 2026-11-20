/**
 * Extension element types that hold child nodes (extensionApi 1.x, additive).
 *
 * `isParentNode` is pure and runs on both the server and the editor, so it cannot read the live
 * registry (functions do not cross into the browser). The server fills this set from
 * `rememberExtensions`, the admin fills it from the manifests in `editor/config`. Both sides
 * then agree on which extension types may be parents.
 */

import type { ExtensionManifest } from "./types.ts";

const KEY = Symbol.for("emvb.extensions.containers.v1");

type Store = { types: Set<string> };

function store(): Store {
  const g = globalThis as typeof globalThis & { [KEY]?: Store };
  if (!g[KEY]) g[KEY] = { types: new Set() };
  return g[KEY];
}

/** Replace the container set from a list of manifests. Elements without `container: true` are leaves. */
export function setContainerExtensionTypes(manifests: readonly ExtensionManifest[]): void {
  const types = new Set<string>();
  for (const manifest of manifests) {
    for (const element of manifest.elements) {
      if (element.container === true) types.add(element.type);
    }
  }
  store().types = types;
}

/** True when a stored extension node of this type may hold children. */
export function isContainerExtensionType(type: string): boolean {
  return store().types.has(type);
}
