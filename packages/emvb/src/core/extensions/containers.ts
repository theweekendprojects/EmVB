/**
 * Extension element types that hold child nodes, which child types they accept, and which types are
 * list parts (extensionApi 1.x, additive).
 *
 * `isParentNode` and the drop rules are pure and run on both the server and the editor, so they
 * cannot read the live registry (functions do not cross into the browser). The server fills this
 * from `rememberExtensions`, the admin from the manifests in `editor/config`. Both sides then agree.
 */

import type { ExtensionManifest } from "./types.ts";

const KEY = Symbol.for("emvb.extensions.containers.v2");

type Store = {
  types: Set<string>;
  accepts: Map<string, ReadonlySet<string>>;
  parts: Set<string>;
};

function store(): Store {
  const g = globalThis as typeof globalThis & { [KEY]?: Store };
  if (!g[KEY]) g[KEY] = { types: new Set(), accepts: new Map(), parts: new Set() };
  return g[KEY];
}

/** Replace the registry from a list of manifests. */
export function setContainerExtensionTypes(manifests: readonly ExtensionManifest[]): void {
  const types = new Set<string>();
  const accepts = new Map<string, ReadonlySet<string>>();
  const parts = new Set<string>();
  for (const manifest of manifests) {
    for (const element of manifest.elements) {
      if (element.container === true) types.add(element.type);
      if (element.accepts && element.accepts.length > 0) {
        accepts.set(element.type, new Set(element.accepts));
      }
      if (element.part === true) parts.add(element.type);
    }
  }
  const s = store();
  s.types = types;
  s.accepts = accepts;
  s.parts = parts;
}

/** True when a stored extension node of this type may hold children. */
export function isContainerExtensionType(type: string): boolean {
  return store().types.has(type);
}

/** The child types an extension container accepts, or `undefined` when it accepts any child. */
export function extensionAccepts(type: string): ReadonlySet<string> | undefined {
  return store().accepts.get(type);
}

/** True for a list part: its markup is not wrapped and it may only sit in a parent that accepts it. */
export function isPartExtensionType(type: string): boolean {
  return store().parts.has(type);
}
