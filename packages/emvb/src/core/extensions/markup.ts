/**
 * Check an extension's markup output (extensionApi 1.x, additive).
 *
 * Fail closed on structure: a tag outside core's serializer allowlist, too deep or too large a tree,
 * or a malformed node refuses the whole element, so it shows the placeholder.
 * Drop on values: an unlisted class, an event handler, an unsafe URL, any inline style, or a value
 * that breaks a value rule is removed, and the rest of the element still renders.
 *
 * Ids: an element's ids are scoped by the layout node that renders it (`scope`), so two instances
 * of one extension on a page never share an id. References to an id (`#x`, `for`, `aria-*`
 * id lists, `popovertarget`) get the same scope, so they keep pointing at the right element.
 * Ids that would clobber a browser global (`location`, `document`, ...) or claim EmVB's own
 * `emvb-` names are dropped, the same rule S-12 applies to layouts.
 */
import { isAllowedAttr, isAllowedTag, VALUE_RULES, type VNode } from "../render/vnode.ts";
import { sanitizeHref } from "../sanitize/href.ts";
import { sanitizeUrl } from "../sanitize/url.ts";
import { isShadowingId } from "../shadowing-ids.ts";
import type { ExtensionMarkup } from "./types.ts";

const MAX_DEPTH = 12;
const MAX_NODES = 200;
/** Images and posters load over http(s) only, so a data: URL cannot hide script or a second address. */
const MEDIA_SCHEMES: ReadonlySet<string> = new Set(["http:", "https:"]);
/** A plain element id: starts with a letter, then letters, digits, `-` or `_`. */
const ID_RULE = /^[A-Za-z][\w-]{0,63}$/;
/** Attributes whose value is one id. */
const ID_ATTRS: ReadonlySet<string> = new Set(["for", "popovertarget"]);
/** Attributes whose value is a space-separated list of ids. */
const ID_LIST_ATTRS: ReadonlySet<string> = new Set([
  "aria-labelledby",
  "aria-describedby",
  "aria-controls",
  "aria-owns",
  "aria-details",
  "aria-errormessage",
]);

/** True for a result shaped like `{ markup: VNode }`. */
export function isExtensionMarkup(raw: unknown): raw is ExtensionMarkup {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const markup = (raw as { markup?: unknown }).markup;
  return !!markup && typeof markup === "object" && typeof (markup as VNode).tag === "string";
}

/** An id a markup author may use, or `undefined` when it must be dropped. */
function usableId(value: string): boolean {
  return ID_RULE.test(value) && !isShadowingId(value) && !value.startsWith("emvb");
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

/** A `#fragment` reference, scoped. Other URLs go through the href policy. */
function safeHrefValue(value: string, scope: string | undefined): string | undefined {
  if (value.startsWith("#")) {
    const fragment = value.slice(1);
    if (!usableId(fragment)) return undefined;
    return scope === undefined ? value : `#${scope}-${fragment}`;
  }
  return sanitizeHref(value);
}

/** The value to keep for one attribute, or `undefined` to drop it. */
function safeAttr(
  name: string,
  value: string,
  classes: ReadonlySet<string>,
  scope: string | undefined,
): string | undefined {
  // A value rule (popover, popovertarget) drops the attribute, never the element.
  const rule = VALUE_RULES[name];
  if (rule && !rule.test(value)) return undefined;
  if (name === "class") {
    const kept = value.split(/\s+/).filter((token) => classes.has(token));
    return kept.length > 0 ? kept.join(" ") : undefined;
  }
  // `style` is dropped: core's serializer does not allow it, so markup cannot set inline CSS.
  if (name === "style") return undefined;
  if (name === "id") {
    if (!usableId(value)) return undefined;
    return scope === undefined ? value : `${scope}-${value}`;
  }
  if (ID_ATTRS.has(name)) {
    if (!usableId(value)) return undefined;
    return scope === undefined ? value : `${scope}-${value}`;
  }
  if (ID_LIST_ATTRS.has(name)) {
    const ids = value.split(/\s+/).filter(Boolean);
    if (ids.length === 0 || !ids.every(usableId)) return undefined;
    return scope === undefined ? ids.join(" ") : ids.map((id) => `${scope}-${id}`).join(" ");
  }
  if (name === "srcset") return safeSrcset(value);
  if (name === "href" || name === "xlink:href") return safeHrefValue(value, scope);
  if (name === "action" || name === "formaction") return sanitizeHref(value);
  if (name === "src" || name === "poster") return sanitizeUrl(value, MEDIA_SCHEMES);
  return value;
}

type Budget = { left: number };

function walk(
  node: VNode,
  depth: number,
  budget: Budget,
  classes: ReadonlySet<string>,
  scope: string | undefined,
): VNode | undefined {
  if (depth > MAX_DEPTH || budget.left <= 0) return undefined;
  if (!node || typeof node !== "object" || typeof node.tag !== "string") return undefined;
  if (!isAllowedTag(node.tag)) return undefined;
  budget.left -= 1;
  const attrs: Record<string, string> = {};
  for (const [name, value] of Object.entries(node.attrs ?? {})) {
    if (typeof value !== "string" || /^on/i.test(name) || !isAllowedAttr(name)) continue;
    const kept = safeAttr(name, value, classes, scope);
    if (kept !== undefined) attrs[name] = kept;
  }
  // A non-array `children` is malformed: refuse the element rather than guess.
  if (node.children !== undefined && !Array.isArray(node.children)) return undefined;
  const children: (VNode | string)[] = [];
  for (const child of node.children ?? []) {
    if (typeof child === "string") {
      children.push(child);
      continue;
    }
    const checked = walk(child, depth + 1, budget, classes, scope);
    if (!checked) return undefined;
    children.push(checked);
  }
  return { tag: node.tag, attrs, children };
}

/**
 * Return a checked copy of an extension's markup, or `undefined` when the element must show its
 * placeholder. `classes` is the package's allowlist from the registry. `scope`, when given, prefixes
 * the ids and their references so this element's ids are unique on the page; omit it when the
 * markup was already scoped (the editor re-checks stored output this way).
 */
export function safeMarkup(
  root: VNode,
  classes: ReadonlySet<string>,
  scope?: string,
): VNode | undefined {
  // A throwing getter or proxy in extension output must not escape: it is a placeholder.
  try {
    return walk(root, 0, { left: MAX_NODES }, classes, scope);
  } catch {
    return undefined;
  }
}
