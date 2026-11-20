/**
 * Validate and turn a live EmVBExtension into a manifest + kept live object (W-927).
 */

import { extensionIdIssue, extensionNameIssue, extensionType } from "./namespace.ts";
import { isAllowedExtensionFieldKind, schemaDefaults } from "./schema.ts";
import type {
  EmVBExtension,
  ExtensionElement,
  ExtensionManifest,
  ExtensionPanel,
  ExtensionSource,
} from "./types.ts";
import { EXTENSION_API_VERSION } from "./types.ts";
import { classAllowlist } from "./markup.ts";

/** At most this many stylesheet or runtime specifiers per package. */
const MAX_ASSETS = 16;
/** A package specifier (`@scope/pkg/file.css`) or a site path (`/assets/x.css`). */
const ASSET_SPECIFIER = /^[@A-Za-z0-9._~/:-]{1,200}$/;

/** Unique, well-formed specifiers in the order given. Anything else is dropped. */
function specifierList(values: readonly unknown[]): string[] {
  const kept = new Set<string>();
  for (const value of values) {
    if (typeof value === "string" && ASSET_SPECIFIER.test(value) && !value.includes("..")) {
      kept.add(value);
    }
    if (kept.size >= MAX_ASSETS) break;
  }
  return [...kept];
}

export type NormalizedExtension = {
  live: EmVBExtension;
  manifest: ExtensionManifest;
};

// The daisyUI extension alone has 70 elements, so the cap leaves room for a full set plus more.
const MAX_ELEMENTS = 128;
const MAX_PANELS = 8;
const MAX_SOURCES = 8;

function normalizeElement(
  pkg: string,
  element: ExtensionElement,
): ExtensionManifest["elements"][number] | undefined {
  if (extensionNameIssue(element.name)) return undefined;
  const type = extensionType(pkg, element.name);
  if (!type) return undefined;
  if (typeof element.render !== "function") return undefined;
  if (element.schema.type !== "object") return undefined;
  const fields = (element.fields ?? [])
    .filter(
      (f) =>
        typeof f.key === "string" &&
        /^[a-zA-Z][a-zA-Z0-9_]{0,31}$/.test(f.key) &&
        isAllowedExtensionFieldKind(f.kind) &&
        typeof f.label === "string" &&
        f.label.length > 0 &&
        f.label.length <= 80,
    )
    .slice(0, 32);
  // Child element names become stored types. A name that does not form a valid type is dropped.
  const accepts = (Array.isArray(element.accepts) ? element.accepts : [])
    .map((name) => (typeof name === "string" ? extensionType(pkg, name) : undefined))
    .filter((t): t is string => t !== undefined);
  const defaults = {
    ...schemaDefaults(element.schema),
    ...(typeof element.defaults === "function" ? element.defaults() : {}),
  };
  return {
    type,
    name: element.name,
    label: element.label.trim().slice(0, 80) || element.name,
    group: element.group ?? "content",
    ...(accepts.length > 0
      ? { container: true, accepts }
      : element.container === true
        ? { container: true }
        : {}),
    ...(element.part === true ? { part: true } : {}),
    schema: element.schema,
    fields,
    defaults,
  };
}

function normalizePanel(
  pkg: string,
  panel: ExtensionPanel,
): ExtensionManifest["panels"][number] | undefined {
  if (extensionNameIssue(panel.name)) return undefined;
  return {
    id: `ext:${pkg}/${panel.name}`,
    name: panel.name,
    label: panel.label.trim().slice(0, 80) || panel.name,
    ...(panel.description ? { description: panel.description.slice(0, 500) } : {}),
    ...(panel.source && !extensionNameIssue(panel.source) ? { source: panel.source } : {}),
  };
}

function normalizeSource(
  pkg: string,
  source: ExtensionSource,
): ExtensionManifest["sources"][number] | undefined {
  if (extensionNameIssue(source.name)) return undefined;
  if (typeof source.resolve !== "function") return undefined;
  const capabilities = (source.capabilities ?? []).filter(
    (c): c is "text" | "url" | "image" => c === "text" || c === "url" || c === "image",
  );
  if (capabilities.length === 0) return undefined;
  return {
    id: `ext:${pkg}/${source.name}`,
    name: source.name,
    label: source.label.trim().slice(0, 80) || source.name,
    capabilities,
  };
}

/**
 * Accept a live extension or refuse it (returns undefined). Refused extensions
 * are skipped so a bad neighbour cannot take down the site's EmVB plugin.
 */
export function normalizeExtension(input: unknown): NormalizedExtension | undefined {
  if (!input || typeof input !== "object") return undefined;
  const ext = input as EmVBExtension;
  if (ext.extensionApi !== EXTENSION_API_VERSION) return undefined;
  if (extensionIdIssue(ext.id)) return undefined;

  const elementsIn = Array.isArray(ext.elements) ? ext.elements.slice(0, MAX_ELEMENTS) : [];
  const panelsIn = Array.isArray(ext.panels) ? ext.panels.slice(0, MAX_PANELS) : [];
  const sourcesIn = Array.isArray(ext.sources) ? ext.sources.slice(0, MAX_SOURCES) : [];

  const elements = elementsIn
    .map((el) => normalizeElement(ext.id, el))
    .filter((el): el is NonNullable<typeof el> => el !== undefined);
  const panels = panelsIn
    .map((p) => normalizePanel(ext.id, p))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);
  const sources = sourcesIn
    .map((s) => normalizeSource(ext.id, s))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);

  // Keep only live pieces that survived normalization (drop bad entries).
  const liveElements = elementsIn.filter((el) => elements.some((m) => m.name === el.name));
  const livePanels = panelsIn.filter((p) => panels.some((m) => m.name === p.name));
  const liveSources = sourcesIn.filter((s) => sources.some((m) => m.name === s.name));

  const live: EmVBExtension = {
    extensionApi: EXTENSION_API_VERSION,
    id: ext.id,
    ...(ext.label ? { label: ext.label.trim().slice(0, 80) } : {}),
    elements: liveElements,
    panels: livePanels,
    sources: liveSources,
    // Additive 1.x fields. Each one is copied through its own check, so a bad value is dropped.
    ...(ext.classes ? { classes: [...classAllowlist(ext.classes)] } : {}),
    ...(ext.styles ? { styles: specifierList(ext.styles) } : {}),
    ...(ext.runtime ? { runtime: specifierList(ext.runtime) } : {}),
  };

  return {
    live,
    manifest: {
      extensionApi: EXTENSION_API_VERSION,
      id: ext.id,
      label: (ext.label ?? ext.id).trim().slice(0, 80),
      elements,
      panels,
      sources,
    },
  };
}
