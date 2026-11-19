/**
 * Builds draft test pages for checking daisyUI components in the EmVB editor: one page with every
 * component at its catalog defaults, then pages that show each classMap option of each component.
 *
 *   bun scripts/daisy-check-pages.ts [outDir]   # writes pages.json and map.json (default: the OS temp dir)
 *
 * The pages are drafts. They are created through the content API, rendered in the editor canvas,
 * and never published.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DAISY_COMPONENT_CATALOG } from "../packages/emvb-daisyui/src/catalog/index.ts";

type Field = {
  key: string;
  kind: string;
  default: unknown;
  options?: readonly string[];
  classMap?: Readonly<Record<string, string>>;
};
export type CheckPage = { title: string; slug: string; layout: Record<string, unknown> };
export type CheckMap = Record<string, { component: string; option: string | null }>;

const PER_PAGE = 24;

/** A provider node for one component, with the field defaults and one option overridden. */
function node(
  id: string,
  component: string,
  fields: readonly Field[],
  override?: { key: string; value: unknown },
): Record<string, unknown> {
  const props: Record<string, unknown> = Object.fromEntries(fields.map((f) => [f.key, f.default]));
  if (override) props[override.key] = override.value;
  // Stored props keep only the value types a provider node holds.
  for (const [key, value] of Object.entries(props))
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean")
      delete props[key];
  return { id, type: "provider", provider: "daisyui", component, props, children: [] };
}

/** A page of nodes, in a root container. */
function page(title: string, slug: string, nodes: Record<string, unknown>[]): CheckPage {
  return {
    title,
    slug,
    layout: {
      schemaVersion: 18,
      root: { id: "root0001", type: "container", props: {}, children: nodes },
    },
  };
}

export function buildCheckPages(): { pages: CheckPage[]; map: CheckMap } {
  const pages: CheckPage[] = [];
  const map: CheckMap = {};
  let counter = 0;
  const nextId = () => `c${String(++counter).padStart(7, "0")}`;

  // Every component at its defaults, one page.
  const defaults: Record<string, unknown>[] = [];
  for (const def of DAISY_COMPONENT_CATALOG) {
    const id = nextId();
    map[id] = { component: def.id, option: null };
    defaults.push(node(id, def.id, def.fields as readonly Field[]));
  }
  pages.push(page("Daisy check: defaults", "daisy-check-defaults", defaults));

  // Every option, in pages of PER_PAGE nodes, so each page stays readable on the canvas.
  const variants: Record<string, unknown>[] = [];
  for (const def of DAISY_COMPONENT_CATALOG) {
    for (const field of def.fields as readonly Field[]) {
      if (!field.classMap) continue;
      for (const option of Object.keys(field.classMap)) {
        const id = nextId();
        const isBool = field.kind === "boolean";
        const value = isBool ? option === "true" : option;
        map[id] = { component: def.id, option: `${field.key}=${option}` };
        variants.push(node(id, def.id, def.fields as readonly Field[], { key: field.key, value }));
      }
    }
  }
  for (let i = 0; i * PER_PAGE < variants.length; i++) {
    const chunk = variants.slice(i * PER_PAGE, (i + 1) * PER_PAGE);
    pages.push(page(`Daisy check: options ${i + 1}`, `daisy-check-options-${i + 1}`, chunk));
  }
  return { pages, map };
}

if (import.meta.main) {
  const out = process.argv[2] ?? join(tmpdir(), "daisy-check");
  mkdirSync(out, { recursive: true });
  const { pages, map } = buildCheckPages();
  writeFileSync(join(out, "pages.json"), JSON.stringify(pages));
  writeFileSync(join(out, "map.json"), JSON.stringify(map, null, 1));
  process.stdout.write(`${pages.length} pages, ${Object.keys(map).length} nodes in ${out}\n`);
}
