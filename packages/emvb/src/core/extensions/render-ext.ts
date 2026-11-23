/**
 * Render one extension element node to a VNode (W-927, D-066).
 * Missing extension, throwing render, or illegal output → placeholder.
 */

import type { LayoutNode } from "../schema/layout.ts";
import type { VNode } from "../render/vnode.ts";
import { extensionClassAllowlist, liveElement, liveExtension } from "./registry.ts";
import { validateExtensionProps } from "./schema.ts";
import { safeExtensionOutput } from "./safe-nodes.ts";
import { extensionPlaceholderVNode } from "./placeholder.ts";
import type { ExtensionMarkup, ExtensionRenderContext, ExtensionRenderMode } from "./types.ts";
import { parseExtensionType } from "./namespace.ts";
import { cleanBoundText } from "../data/bindings.ts";
import { fillSlot, isExtensionMarkup, safeMarkup } from "./markup.ts";
import { isContainerExtensionType, isPartExtensionType } from "./containers.ts";

export type { ExtensionRenderMode } from "./types.ts";

function isThenable(value: unknown): value is Promise<unknown> {
  return !!value && typeof (value as { then?: unknown }).then === "function";
}

/** Longest source value kept, in UTF-16 code units. */
const MAX_SOURCE_VALUE = 2000;
/** Values kept per source. */
const MAX_SOURCE_FIELDS = 32;

/**
 * A source's result with bad keys and non-string values dropped, and each value cleaned like a
 * bound value (control characters and bidi overrides removed, length capped; W-1088).
 */
function cleanSourceRecord(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  let n = 0;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (n >= MAX_SOURCE_FIELDS) break;
    if (!/^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/.test(key)) continue;
    if (typeof value !== "string") continue;
    out[key] = cleanBoundText(value, MAX_SOURCE_VALUE);
    n += 1;
  }
  return out;
}

/**
 * Resolve source values for one package (sync resolvers only).
 * Async sources are left empty here; hosts that need them can pre-resolve later.
 */
export function syncSourceValues(pkg: string): Record<string, Record<string, string>> {
  const ext = liveExtension(pkg);
  if (!ext?.sources) return {};
  const out: Record<string, Record<string, string>> = {};
  for (const source of ext.sources) {
    try {
      const result = source.resolve();
      if (result && typeof result === "object" && !Array.isArray(result) && !isThenable(result)) {
        out[source.name] = cleanSourceRecord(result);
      } else {
        out[source.name] = {};
      }
    } catch {
      out[source.name] = {};
    }
  }
  return out;
}

/** How long the editor waits for one source (W-1088). */
const SOURCE_TIMEOUT_MS = 5000;

/**
 * W-1088 (#36): one source's values for the editor's extension panels, awaited (a source may be
 * async), cleaned like bound values. Undefined when the extension or source isn't live here, the
 * resolver throws, or it takes longer than `timeoutMs`.
 */
export async function resolveExtensionSource(
  pkg: string,
  name: string,
  timeoutMs = SOURCE_TIMEOUT_MS,
): Promise<Record<string, string> | undefined> {
  const source = liveExtension(pkg)?.sources?.find((s) => s.name === name);
  if (!source) return undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      Promise.resolve().then(() => source.resolve()),
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => resolve(undefined), timeoutMs);
      }),
    ]);
    if (!result || typeof result !== "object" || Array.isArray(result)) return undefined;
    return cleanSourceRecord(result);
  } catch {
    return undefined;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export type VisitChildren = (nodes: LayoutNode[]) => VNode[];

const propsOf = (node: { props?: unknown }): Record<string, unknown> =>
  node.props && typeof node.props === "object" && !Array.isArray(node.props)
    ? (node.props as Record<string, unknown>)
    : {};

/** Stable JSON: object keys sorted, so equal props give equal keys. */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/**
 * W-1086: the key of one extension element's output: its type and props. The admin has no
 * extension code, so the editor canvas and the HTML export ask the server for outputs by key.
 */
export function extensionOutputKey(node: { type: string; props?: unknown; id?: unknown }): string {
  // The id is part of the key: a markup output carries its element's ids, so two instances with the
  // same props must not share one output.
  const id = typeof node.id === "string" ? `\n#${node.id}` : "";
  return `${node.type}${id}\n${stableJson(propsOf(node))}`;
}

/** Raw render output per `extensionOutputKey`, rendered by the server for the admin. */
export type ExtensionOutputs = ReadonlyMap<string, unknown>;

/** A checked live output: either layout nodes (the classic path) or a checked markup tree. */
export type LiveExtensionRender =
  | { kind: "nodes"; nodes: LayoutNode[] }
  | { kind: "markup"; markup: VNode };

/**
 * The package's markup check: a markup tree that passes, or `undefined` (placeholder). The class
 * allowlist is the package's registered one; a package without one passes no classes.
 */
function checkedMarkup(raw: ExtensionMarkup, pkg: string, scope?: string): VNode | undefined {
  return safeMarkup(raw.markup, extensionClassAllowlist(pkg) ?? new Set(), scope);
}

/**
 * The id scope of one layout node: its ids and their references are prefixed with it, so two
 * instances of one element never share an id on a page. Only the node id's letters and digits.
 */
export function markupScope(nodeId: string | undefined): string | undefined {
  if (typeof nodeId !== "string") return undefined;
  const clean = nodeId.replace(/[^A-Za-z0-9]/g, "");
  return clean.length > 0 ? `ext-${clean}` : undefined;
}

/**
 * Run the live render() of a stored extension element and check its output. Undefined when the
 * extension is missing here, render throws, or nothing legal is left. Markup output (`{ markup }`)
 * is checked by `markup.ts`; the other outputs are layout nodes.
 */
export function liveExtensionRender(
  node: { type: string; props?: unknown },
  /** The scope of the node's ids (see `markupScope`); omitted, the ids are checked but not scoped. */
  scope?: string,
  /** The mode the output is drawn in; elements can read it from their context. */
  mode: ExtensionRenderMode = "public",
  /** Stored child nodes under this element (zero for a leaf). */
  childCount = 0,
): LiveExtensionRender | undefined {
  const parsed = parseExtensionType(node.type);
  const found = parsed ? liveElement(node.type) : undefined;
  if (!parsed || !found) return undefined;
  const checked = validateExtensionProps(found.manifest.schema, propsOf(node));
  const ctx: ExtensionRenderContext = {
    sources: syncSourceValues(parsed.pkg),
    mode,
    childCount,
  };
  let raw: unknown;
  try {
    raw = found.element.render(checked.props, ctx);
  } catch {
    return undefined;
  }
  if (isExtensionMarkup(raw)) {
    const markup = checkedMarkup(raw, parsed.pkg, scope);
    return markup ? { kind: "markup", markup } : undefined;
  }
  const safe = safeExtensionOutput(raw, Math.random, extensionClassAllowlist(parsed.pkg));
  return safe.length > 0 ? { kind: "nodes", nodes: safe } : undefined;
}

/**
 * Layout nodes for a stored extension element, or undefined. Markup output is not nodes, so it
 * is undefined here; callers that accept markup use `liveExtensionRender`.
 */
export function liveExtensionOutput(node: {
  type: string;
  props?: unknown;
}): LayoutNode[] | undefined {
  const live = liveExtensionRender(node);
  return live?.kind === "nodes" ? live.nodes : undefined;
}

/**
 * A container's list parts (radio tabs, say) share a group by their `name`. Two containers on one
 * page must not share one, so each part's name is scoped by its container. Inside one container
 * the parts keep one name, so they stay one group.
 */
function scopePartNames(kids: VNode[], scope: string | undefined): VNode[] {
  if (scope === undefined) return kids;
  return kids.map((kid) => {
    const type = kid.attrs?.["data-emvb-ext"];
    const name = kid.attrs?.name;
    if (typeof type !== "string" || !isPartExtensionType(type) || typeof name !== "string")
      return kid;
    return { ...kid, attrs: { ...kid.attrs, name: `${scope}-${name}` } };
  });
}

/**
 * Build the VNode for a stored extension element. Always returns a node (placeholder
 * on failure) so siblings keep rendering. A container's stored children are rendered by core and
 * placed at its slot (markup) or after its output (nodes); a leaf ignores them.
 */
export function renderExtensionNode(
  node: LayoutNode,
  mode: ExtensionRenderMode,
  visitChildren: VisitChildren,
  /** W-1086: server-rendered outputs (the admin's canvas and export), by `extensionOutputKey`. */
  outputs?: ExtensionOutputs,
  /** W-1086: told the package id whenever one of its elements renders. */
  rendered?: (pkg: string) => void,
): VNode {
  const id = typeof node.id === "string" ? node.id : undefined;
  const type = node.type;
  const parsed = parseExtensionType(type);
  if (!parsed) {
    return extensionPlaceholderVNode(type, id, mode);
  }
  const stored: LayoutNode[] = isContainerExtensionType(type)
    ? ((node as { children?: LayoutNode[] }).children ?? [])
    : [];

  const live = liveExtensionRender(node, markupScope(id), mode, stored.length);
  let markup: VNode | undefined = live?.kind === "markup" ? live.markup : undefined;
  let safe: LayoutNode[] | undefined = live?.kind === "nodes" ? live.nodes : undefined;
  if (!markup && !safe && !liveElement(type) && outputs?.has(extensionOutputKey(node))) {
    // The server's output is checked again here, with the allowlist the admin was sent.
    const serverOutput = outputs.get(extensionOutputKey(node));
    if (isExtensionMarkup(serverOutput)) {
      markup = checkedMarkup(serverOutput, parsed.pkg);
    } else {
      safe = safeExtensionOutput(serverOutput, Math.random, extensionClassAllowlist(parsed.pkg));
    }
  }

  const wrap = (children: VNode[]): VNode => ({
    tag: "div",
    attrs: {
      class: "emvb-ext",
      "data-emvb-ext": type,
      ...(id && mode === "editor" ? { "data-emvb-id": id } : {}),
    },
    children,
  });

  const kids = scopePartNames(visitChildren(stored), markupScope(id));
  if (markup) {
    rendered?.(parsed.pkg);
    // The children are core output, already safe: they are placed after the check, never filtered.
    const filled = fillSlot(markup, kids);
    if (isPartExtensionType(type)) {
      // A list part sits directly in its parent's markup: no wrapper of its own.
      return {
        tag: filled.root.tag,
        attrs: {
          ...filled.root.attrs,
          "data-emvb-ext": type,
          ...(id && mode === "editor" ? { "data-emvb-id": id } : {}),
        },
        children: [...filled.root.children, ...filled.unused],
      };
    }
    return wrap([filled.root, ...filled.unused]);
  }
  if (!safe || safe.length === 0) {
    return extensionPlaceholderVNode(type, id, mode);
  }
  rendered?.(parsed.pkg);
  return wrap([...visitChildren(safe), ...kids]);
}
