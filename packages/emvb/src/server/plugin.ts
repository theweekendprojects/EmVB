import { definePlugin } from "emdash";
import { ADMIN_ENTRY, PLUGIN_ID, PLUGIN_VERSION } from "../constants.ts";
import {
  designDraftRoute,
  designPublishRoute,
  designRoute,
  designSaveRoute,
} from "./design-routes.ts";
import {
  savedSectionDeleteRoute,
  savedSectionGetRoute,
  savedSectionRenameRoute,
  savedSectionSaveRoute,
  savedSectionsRoute,
} from "./saved-sections.ts";
import { iconDeleteRoute, iconRenameRoute, iconUploadRoute, iconsRoute } from "./icon-routes.ts";
import { beforeSave } from "./hooks.ts";
import {
  agentsRoute,
  agentsSaveRoute,
  beforePublish,
  pageAgentVersionsRoute,
} from "./agent-settings.ts";
import { canvasStyleUrls } from "../core/canvas-styles.ts";
import { canvasCollectionSlugs } from "../core/canvas-collections.ts";
import { TOOLS } from "../mcp/tools.ts";
import { mcpRoutes, mcpToolConfig } from "./mcp-routes.ts";

/**
 * Import each external provider module once so its registration side effect runs on the server.
 * Failures are logged, not thrown: a bad specifier must not take the whole plugin (and its pages)
 * down. The dynamic specifier is validated in `emvb()` before it reaches here.
 */
let serverProvidersStarted = false;
function registerServerProviders(specifiers: readonly string[]): void {
  if (serverProvidersStarted || specifiers.length === 0) return;
  serverProvidersStarted = true;
  for (const specifier of specifiers) {
    import(/* @vite-ignore */ specifier).catch((error: unknown) => {
      // A bad provider specifier must surface (it shows as "Unknown provider" on the page) but
      // never throw and take the plugin down. Logging the cause is the only diagnostic here.
      // eslint-disable-next-line no-console
      console.error(`EmVB: failed to load provider "${specifier}":`, error);
    });
  }
}

export function createPlugin(
  options: { canvasStyles?: unknown; canvasCollections?: unknown; providers?: unknown } = {},
) {
  const canvasStyles = canvasStyleUrls(options.canvasStyles);
  const canvasCollections = canvasCollectionSlugs(options.canvasCollections);
  const providers = Array.isArray(options.providers)
    ? options.providers.filter((p): p is string => typeof p === "string" && p.length > 0)
    : [];
  // Register external providers on the SERVER so `provider` nodes render on public pages.
  // The provider module self-registers its singleton on import (idempotent). The editor (browser)
  // registers separately via the host's `adminEntry` wrapper — see EmVBOptions.providers.
  void registerServerProviders(providers);
  return definePlugin({
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    capabilities: [
      "content:read",
      // W-898: find host fields that use the emvb:canvas widget.
      "schema:read",
      "content:write",
      "content:publish",
      "content:revisions:read",
      "hooks.content-policy:register",
    ],
    // W-239: uploaded SVG icons (EmDash's media library refuses SVG by default).
    storage: {
      design: { indexes: [] },
      icons: { indexes: ["uploadedAt"] },
      // D-057: agent changes and the site styles history.
      agentlog: { indexes: ["at", "pageId"] },
      designhistory: { indexes: ["at"] },
      // W-875 (D-060): saved sections, by name, per site.
      emvb_saved_sections: { indexes: ["updatedAt"] },
    },
    hooks: {
      "content:beforeSave": {
        handler: (event, ctx) => beforeSave(event, ctx, canvasCollections),
        errorPolicy: "abort",
      },
      // D-055: EmDash's own MCP tools can't publish EmVB pages unless the admin allowed it.
      "content:beforePublish": {
        handler: (event, ctx) => beforePublish(event, ctx, canvasCollections),
      },
    },
    admin: {
      entry: ADMIN_ENTRY,
      pages: [
        { path: "/pages", label: "Pages VisualBuilder", icon: "layout" },
        { path: "/theme", label: "Theme Builder", icon: "layout" },
        { path: "/agents", label: "AI agents", icon: "layout" },
        { path: "/collections", label: "Host collections", icon: "layout" },
      ],
      fieldWidgets: [
        { name: "layout", label: "EmVB page (read-only)", fieldTypes: ["json"] },
        { name: "canvas", label: "Edit with EmVB", fieldTypes: ["json"] },
      ],
    },
    routes: {
      health: {
        public: true,
        handler: async () => ({ ok: true, plugin: PLUGIN_ID, version: PLUGIN_VERSION }),
      },
      // W-327: what the editor needs from the host's `emvb()` options.
      "editor/config": { handler: async () => ({ canvasStyles, canvasCollections, providers }) },
      design: designRoute,
      "design/draft": designDraftRoute,
      "design/save": designSaveRoute,
      "design/publish": designPublishRoute,
      icons: iconsRoute,
      "saved-sections": savedSectionsRoute,
      "saved-sections/get": savedSectionGetRoute,
      "saved-sections/save": savedSectionSaveRoute,
      "saved-sections/rename": savedSectionRenameRoute,
      "saved-sections/delete": savedSectionDeleteRoute,
      "icons/upload": iconUploadRoute,
      "icons/rename": iconRenameRoute,
      "icons/delete": iconDeleteRoute,
      // W-463: the Agents tab (admins only).
      agents: agentsRoute,
      "agents/save": agentsSaveRoute,
      "agents/page": pageAgentVersionsRoute,
      // R1 D-054: EmDash's /_emdash/api/mcp lists these as emvb__<tool> (EmDash 1.2+, mcp: true).
      ...mcpRoutes(TOOLS),
    },
    mcp: mcpToolConfig(TOOLS),
  });
}
