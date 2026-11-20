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
/**
 * A class token in Tailwind syntax: letters, digits and the characters variants and arbitrary values
 * use (`sm:w-fit`, `!mt-0`, `[&>*]:my-0`). Spaces, quotes and markup characters are refused.
 */
const CLASS_TOKEN = /^[A-Za-z0-9_:!\-[\]&>*./%#]{1,96}$/;
/** Images and posters load over http(s) only, so a data: URL cannot hide script or a second address. */
const MEDIA_SCHEMES: ReadonlySet<string> = new Set(["http:", "https:"]);

/** True for a result shaped like `{ markup: VNode }`. */
export function isExtensionMarkup(raw: unknown): raw is ExtensionMarkup {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const markup = (raw as { markup?: unknown }).markup;
  return !!markup && typeof markup === "object" && typeof (markup as VNode).tag === "string";
}

/** The class tokens a package declared. Tokens that do not match the class pattern are ignored. */
export function classAllowlist(classes: readonly string[] | undefined): ReadonlySet<string> {
  return new Set((classes ?? []).filter((name) => CLASS_TOKEN.test(name)));
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

/** Marker tag an extension puts where its children go. Core replaces it before the check. */
export const SLOT_TAG = "emvb-slot";

/**
 * Put the rendered children at the first slot marker and remove any later markers. Children that
 * found no marker come back as `unused`, so the caller can append them. Runs before `safeMarkup`,
 * so the marker never reaches the serializer.
 */
export function fillSlot(
  root: VNode,
  children: readonly VNode[],
): { root: VNode; unused: VNode[] } {
  let placed = false;
  const place = (): VNode[] => {
    if (placed) return [];
    placed = true;
    return [...children];
  };
  if (root.tag === SLOT_TAG)
    return { root: { tag: "div", attrs: {}, children: place() }, unused: [] };
  const fill = (node: VNode): VNode => ({
    tag: node.tag,
    attrs: node.attrs ?? {},
    children: (node.children ?? []).flatMap((child): (VNode | string)[] => {
      if (typeof child === "string") return [child];
      if (child.tag === SLOT_TAG) return place();
      return [fill(child)];
    }),
  });
  const filled = fill(root);
  return { root: filled, unused: placed ? [] : [...children] };
}

/**
 * Return a checked copy of an extension's markup, or `undefined` when the element must show its
 * placeholder. `classes` is the package's allowlist (see `classAllowlist`).
 */
export function safeMarkup(root: VNode, classes: ReadonlySet<string>): VNode | undefined {
  return walk(root, 0, { left: MAX_NODES }, classes);
}
