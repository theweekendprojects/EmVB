import type { PluginDescriptor } from "emdash";
import { ADMIN_ENTRY, PACKAGE_NAME, PLUGIN_ID, PLUGIN_VERSION } from "./constants.ts";
import { canvasCollectionSlugs } from "./core/canvas-collections.ts";
import { canvasStyleUrls } from "./core/canvas-styles.ts";
import { createPlugin } from "./server/plugin.ts";

/** Options a host site passes to `emvb()` in astro.config. */
export type EmVBOptions = {
  /**
   * Stylesheets the editor canvas loads before EmVB's CSS (W-327): the site's fonts and base
   * styles, so pages look in the editor as on the site. `https:` URLs or site paths
   * (`/styles/site.css`); anything else is ignored.
   */
  canvasStyles?: string[];
  /**
   * Host collections (such as `pages`) whose entries can hold an `emvb:canvas` "Edit with EmVB"
   * field (W-897). EmVB validates and guards that field on save and publish for these only.
   */
  canvasCollections?: string[];
  /**
   * External component providers (e.g. `"@perkyzz/emvb-daisyui"`) as module specifiers. On the
   * SERVER (public render) EmVB imports each one so the provider's singleton is registered and
   * `provider` nodes render. The editor is a browser bundle EmVB cannot add imports to, so to make
   * the provider's elements appear in the Add panel the host must also point `adminEntry` at a
   * wrapper that statically imports the provider and re-exports `@perkyzz/emvb/admin`.
   */
  providers?: string[];
  /**
   * Override the editor bundle module. Use with `providers`: a host wrapper that does
   * `import "@perkyzz/emvb-daisyui"; export * from "@perkyzz/emvb/admin";` so the provider
   * registers in the browser editor too. Defaults to `@perkyzz/emvb/admin`.
   */
  adminEntry?: string;
};

/** Descriptor that host sites add to `emdash({ plugins: [...] })` in astro.config. */
export function emvb(options: EmVBOptions = {}): PluginDescriptor {
  const canvasStyles = canvasStyleUrls(options.canvasStyles);
  const canvasCollections = canvasCollectionSlugs(options.canvasCollections);
  const providers = providerSpecifiers(options.providers);
  const adminEntry = typeof options.adminEntry === "string" && options.adminEntry.trim()
    ? options.adminEntry.trim()
    : ADMIN_ENTRY;
  return {
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    format: "native",
    entrypoint: PACKAGE_NAME,
    adminEntry,
    options: {
      ...(canvasStyles.length > 0 ? { canvasStyles } : {}),
      ...(canvasCollections.length > 0 ? { canvasCollections } : {}),
      ...(providers.length > 0 ? { providers } : {}),
    },
  };
}

/** Keep only plausible npm/module specifiers; never emit tenant/host junk into an import(). */
function providerSpecifiers(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  for (const value of input) {
    if (typeof value !== "string") continue;
    const s = value.trim();
    // A package name or scoped subpath: letters, digits, @, /, -, _, . — no spaces or protocol.
    if (s && /^(@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*(\/[\w.-]+)*$/i.test(s)) seen.add(s);
  }
  return [...seen];
}

export { createPlugin };
export default createPlugin;
