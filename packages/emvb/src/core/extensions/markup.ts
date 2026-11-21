/**
 * Check an extension's markup output (extensionApi 1.x, additive).
 *
 * Fail closed on structure: a tag outside core's serializer allowlist, too deep or too large a tree,
 * or a malformed node refuses the whole element, so it shows the placeholder.
 * Drop on values: an unlisted class, an event handler, an unsafe URL or any inline style is
 * removed, and the rest of the element still renders.
 */
import { isAllowedAttr, isAllowedTag, type VNode } from "../render/vnode.ts";
import { sanitizeHref } from "../sanitize/href.ts";
import { sanitizeUrl } from "../sanitize/url.ts";
import type { ExtensionMarkup } from "./types.ts";

const MAX_DEPTH = 12;
const MAX_NODES = 200;
/** Images and posters load over http(s) only, so a data: URL cannot hide script or a second address. */
const MEDIA_SCHEMES: ReadonlySet<string> = new Set(["http:", "https:"]);

/** True for a result shaped like `{ markup: VNode }`. */
export function isExtensionMarkup(raw: unknown): raw is ExtensionMarkup {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const markup = (raw as { markup?: unknown }).markup;
  return !!markup && typeof markup === "object" && typeof (markup as VNode).tag === "string";
}

/** `srcset` keeps its value only when every candidate URL passes the media policy. */
function safeSrcset(value: string): string | undefined {
  const candidates = value.split(",").map((part) => part.trim());
  if (candidates.length === 0 || candidates.some((part) => part.length === 0)) return undefined;
  for (const candidate of candidates) {
    const url = candidate.split(/\s+/)[0] ?? "";
    if (sanitizeUrl(url, MEDIA_SCHEMES) === undefined) return undefined;
  }
  return value;
}

/** The value to keep for one attribute, or `undefined` to drop it. */
function safeAttr(name: string, value: string, classes: ReadonlySet<string>): string | undefined {
  if (name === "class") {
    const kept = value.split(/\s+/).filter((token) => classes.has(token));
    return kept.length > 0 ? kept.join(" ") : undefined;
  }
  // `style` is dropped: core's serializer does not allow it, so markup cannot set inline CSS.
  if (name === "style") return undefined;
  if (name === "srcset") return safeSrcset(value);
  if (name === "href" || name === "action" || name === "formaction") return sanitizeHref(value);
  if (name === "src" || name === "poster") return sanitizeUrl(value, MEDIA_SCHEMES);
  return value;
}

type Budget = { left: number };

function walk(
  node: VNode,
  depth: number,
  budget: Budget,
  classes: ReadonlySet<string>,
): VNode | undefined {
  if (depth > MAX_DEPTH || budget.left <= 0) return undefined;
  if (!node || typeof node !== "object" || typeof node.tag !== "string") return undefined;
  if (!isAllowedTag(node.tag)) return undefined;
  budget.left -= 1;
  const attrs: Record<string, string> = {};
  for (const [name, value] of Object.entries(node.attrs ?? {})) {
    if (typeof value !== "string" || /^on/i.test(name) || !isAllowedAttr(name)) continue;
    const kept = safeAttr(name, value, classes);
    if (kept !== undefined) attrs[name] = kept;
  }
  const children: (VNode | string)[] = [];
  for (const child of node.children ?? []) {
    if (typeof child === "string") {
      children.push(child);
      continue;
    }
    const checked = walk(child, depth + 1, budget, classes);
    if (!checked) return undefined;
    children.push(checked);
  }
  return { tag: node.tag, attrs, children };
}

/**
 * Return a checked copy of an extension's markup, or `undefined` when the element must show its
 * placeholder. `classes` is the package's allowlist from the registry.
 */
export function safeMarkup(root: VNode, classes: ReadonlySet<string>): VNode | undefined {
  return walk(root, 0, { left: MAX_NODES }, classes);
}
