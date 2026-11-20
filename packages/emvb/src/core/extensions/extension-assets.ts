/**
 * The stylesheets and runtimes a page needs from extensions (extensionApi 1.x, additive).
 *
 * Only packages whose elements appear on the page are listed, so a page without a daisy element
 * never loads daisy's CSS or script. Entries keep first-use order and are unique.
 */
import type { LayoutNode } from "../schema/layout.ts";
import { parseExtensionType } from "./namespace.ts";
import { liveExtension } from "./registry.ts";

export type ExtensionAssets = { styles: string[]; runtimes: string[] };

/** Bound on the walk, so a hostile deep layout cannot stall a render. */
const MAX_VISITED = 10_000;

export function extensionAssetEntries(root: LayoutNode): ExtensionAssets {
  const packages: string[] = [];
  const seen = new Set<string>();
  const stack: unknown[] = [root];
  let visited = 0;
  while (stack.length > 0 && visited < MAX_VISITED) {
    const node = stack.pop() as LayoutNode | undefined;
    visited += 1;
    if (!node || typeof node !== "object") continue;
    const parsed = typeof node.type === "string" ? parseExtensionType(node.type) : undefined;
    if (parsed && !seen.has(parsed.pkg)) {
      seen.add(parsed.pkg);
      packages.push(parsed.pkg);
    }
    const children = (node as { children?: unknown }).children;
    if (Array.isArray(children)) stack.push(...children);
  }
  const styles: string[] = [];
  const runtimes: string[] = [];
  for (const pkg of packages) {
    const ext = liveExtension(pkg);
    for (const href of ext?.styles ?? []) if (!styles.includes(href)) styles.push(href);
    for (const href of ext?.runtime ?? []) if (!runtimes.includes(href)) runtimes.push(href);
  }
  return { styles, runtimes };
}
