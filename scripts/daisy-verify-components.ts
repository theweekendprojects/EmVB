/**
 * Renders every daisyUI component on the public renderer and reports what the page keeps: whether
 * the element renders, whether core refuses an attribute or tag or style, and whether a component
 * holds a nested child. The output is the basis for packages/emvb-daisyui/COMPONENT-STATUS.md.
 *
 *   bun scripts/daisy-verify-components.ts            # markdown table on stdout
 *   bun scripts/daisy-verify-components.ts --json     # one JSON object per component
 */
import {
  emptyDesign,
  renderPage,
  type Layout,
  type RenderWarning,
} from "../packages/emvb/src/core/index.ts";
import { daisyUIProvider, registerDaisyUIProvider } from "../packages/emvb-daisyui/src/provider.ts";
import gallery from "../packages/emvb-daisyui/generated/component-gallery.json";
import { DAISY_COMPONENT_CATALOG } from "../packages/emvb-daisyui/src/catalog/index.ts";
import { DAISY_RECIPES } from "../packages/emvb-daisyui/src/recipes/index.ts";
import { readFileSync } from "node:fs";
import { Glob } from "bun";

type Props = Record<string, string | number | boolean>;

export type ComponentCheck = {
  id: string;
  label: string;
  rendered: boolean;
  refused: string[];
  rejectedStyles: string[];
  /** The editor canvas renders the element (it carries its editor id). */
  canvas: boolean;
  holdsChild: boolean;
};

const PARENT = "node0001";

/** The gallery default props, keeping only the value types a provider node stores. */
function propsOf(defaults: unknown): Props {
  const out: Props = {};
  for (const [key, value] of Object.entries((defaults ?? {}) as Record<string, unknown>))
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
      out[key] = value;
  return out;
}

/** A page with one provider node (and optional nested children) inside a plain container. */
function pageWith(node: Record<string, unknown>): Layout {
  return {
    schemaVersion: 18,
    root: {
      id: "root0001",
      type: "container",
      props: {},
      children: [node],
    },
  } as unknown as Layout;
}

function providerNode(
  id: string,
  component: string,
  props: Props,
  children: unknown[] = [],
): Record<string, unknown> {
  return { id, type: "provider", provider: daisyUIProvider.id, component, props, children };
}

function renderPublic(layout: Layout) {
  return renderPage(layout, emptyDesign(), { mode: "public" });
}

function countButtons(html: string): number {
  return (html.match(/class="[^"]*\bbtn\b/g) ?? []).length;
}

/** One component with its default props, rendered for visitors. */
export function checkComponent(id: string, label: string, props: Props = {}): ComponentCheck {
  const result = renderPublic(pageWith(providerNode(PARENT, id, props)));
  const mine = result.warnings.filter((w: RenderWarning) => w.nodeId === PARENT);
  const refused = mine.filter((w) => w.code === "refused-markup").map((w) => w.detail);
  const rejectedStyles = mine.filter((w) => w.code === "rejected-style").map((w) => w.detail);
  const unknownType = mine.some((w) => w.code === "unknown-type");
  const rendered = !unknownType && !result.html.includes("emvb-unknown") && refused.length === 0;
  const editor = renderPage(pageWith(providerNode(PARENT, id, props)), emptyDesign(), {
    mode: "editor",
  });
  const canvas = editor.html.includes(`data-emvb-id="${PARENT}"`);
  return {
    id,
    label,
    rendered,
    refused,
    rejectedStyles,
    canvas,
    holdsChild: holdsChild(id, props),
  };
}

/**
 * Does the public page keep a Button nested inside this component? Some components ship their own
 * buttons, so the count with the nested Button is compared with the count without it.
 */
function holdsChild(id: string, props: Props): boolean {
  const button = gallery.find((c) => c.id === "button");
  const child = providerNode("child001", "button", propsOf(button?.defaults));
  const without = countButtons(renderPublic(pageWith(providerNode(PARENT, id, props))).html);
  const withChild = countButtons(
    renderPublic(pageWith(providerNode(PARENT, id, props, [child]))).html,
  );
  return withChild > without;
}

/**
 * Option classes checked against daisyUI's own component CSS (`official`) and the compiled sheet.
 * `missing`: daisyUI defines the class but the compiled sheet lacks it. `unknown`: the class has
 * the component's own prefix (`btn-`, `badge-`) but daisyUI doesn't define it, so it's a typo or a
 * made-up variant. Layout utilities (`w-16`) are neither.
 */
export function checkOptionClasses(
  catalog: readonly {
    id: string;
    rootClass: string;
    fields: readonly { classMap?: Readonly<Record<string, string>> }[];
  }[],
  compiled: string,
  official: string,
): Map<string, { missing: string[]; unknown: string[] }> {
  const out = new Map<string, { missing: string[]; unknown: string[] }>();
  for (const def of catalog) {
    const tokens = new Set(
      def.fields.flatMap((f) => Object.values(f.classMap ?? {}).flatMap((c) => c.split(/\s+/))),
    );
    const missing: string[] = [];
    const unknown: string[] = [];
    for (const t of [...tokens].filter(Boolean).toSorted()) {
      const inDaisy = official.includes(`.${t}`);
      if (inDaisy && !compiled.includes(`.${t}`)) missing.push(t);
      else if (!inDaisy && t.startsWith(`${def.rootClass}-`)) unknown.push(t);
    }
    out.set(def.id, { missing, unknown });
  }
  return out;
}

/** A preset (section recipe): its nodes render on the canvas and the public page, none refused. */
export function checkRecipe(id: string, name: string, create: (next: () => string) => unknown[]) {
  let n = 0;
  const nodes = create(() => `rec${String(++n).padStart(4, "0")}`) as Record<string, unknown>[];
  // Every node in the tree, nested children included, must reach the canvas.
  const ids: string[] = [];
  const collect = (node: Record<string, unknown>): void => {
    ids.push(String(node["id"]));
    for (const child of (node["children"] as Record<string, unknown>[] | undefined) ?? [])
      collect(child);
  };
  for (const node of nodes) collect(node);
  const page = pageWith({ id: "wrap0001", type: "container", props: {}, children: nodes });
  const pub = renderPublic(page);
  const editor = renderPage(page, emptyDesign(), { mode: "editor" });
  const refused = pub.warnings.filter((w) => w.code === "refused-markup").map((w) => w.detail);
  const unknown = pub.warnings.filter((w) => w.code === "unknown-type").map((w) => w.detail);
  const canvas = ids.every((nid) => editor.html.includes(`data-emvb-id="${nid}"`));
  const publicOk = ids.length > 0 && !pub.html.includes("emvb-unknown");
  return { id, name, nodes: ids.length, canvas, publicOk, refused, unknown };
}

if (import.meta.main && process.argv.includes("--recipes")) {
  const unregister = registerDaisyUIProvider();
  for (const recipe of DAISY_RECIPES) {
    const row = checkRecipe(recipe.id, recipe.name, (next) => recipe.create(next));
    process.stdout.write(`${JSON.stringify(row)}\n`);
  }
  unregister();
  process.exit(0);
}

if (import.meta.main) {
  const cssPath = process.argv.find((a) => a.startsWith("--css="))?.slice("--css=".length);
  if (cssPath !== undefined || process.argv.includes("--css")) {
    const file =
      cssPath ??
      [...new Glob("demos/cloudflare/dist-daisy-conformance/assets/style-*.css").scanSync(".")][0];
    if (!file) throw new Error("no compiled CSS found; run bun run daisy:conformance first");
    const compiled = readFileSync(file, "utf8");
    // daisyUI's own component CSS, from the installed package: the reference for what exists.
    const official = [
      ...new Glob("packages/emvb-daisyui/node_modules/daisyui/**/*.css").scanSync("."),
    ]
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    const checked = checkOptionClasses(DAISY_COMPONENT_CATALOG as never, compiled, official);
    let bad = 0;
    for (const [id, { missing, unknown }] of checked) {
      if (missing.length === 0 && unknown.length === 0) continue;
      bad++;
      process.stdout.write(
        `${id}\tmissing: ${missing.join(" ") || "-"}\tunknown: ${unknown.join(" ") || "-"}\n`,
      );
    }
    process.stdout.write(`${bad} components with missing or unknown option classes\n`);
    process.exit(bad === 0 ? 0 : 1);
  }
  const unregister = registerDaisyUIProvider();
  const rows = gallery.map((c) => checkComponent(c.id, c.label, propsOf(c.defaults)));
  unregister();
  if (process.argv.includes("--json")) {
    for (const row of rows) process.stdout.write(`${JSON.stringify(row)}\n`);
  } else {
    process.stdout.write(
      "| Component | Canvas | Public | Holds a child | Refused | Rejected styles |\n| --- | --- | --- | --- | --- | --- |\n",
    );
    for (const row of rows)
      process.stdout.write(
        `| ${row.label} (\`${row.id}\`) | ${row.canvas ? "yes" : "NO"} | ${row.rendered ? "renders" : "NO"} | ${row.holdsChild ? "yes" : "no"} | ${row.refused.join(", ") || "-"} | ${row.rejectedStyles.length} |\n`,
      );
    const ok = rows.filter((r) => r.rendered).length;
    const kids = rows.filter((r) => r.holdsChild).length;
    const canvas = rows.filter((r) => r.canvas).length;
    process.stdout.write(
      `\n${canvas}/${rows.length} on the editor canvas; ${ok}/${rows.length} render on the public page; ${kids} hold a child\n`,
    );
  }
}
