// Renders the six daisyUI section recipes to a standalone HTML file that loads the live site's
// compiled daisyUI stylesheet. Used to check the layout without touching the editor or publishing.
// Usage: bun packages/emvb-daisyui/scripts/render-sections-preview.ts <out.html> [stylesheetUrl]
import { writeFileSync } from "node:fs";
import { serialize } from "../../emvb/src/core/render/vnode.ts";
import { daisyUIProvider } from "../src/provider.ts";
import { DAISY_RECIPES } from "../src/recipes/index.ts";
import type { DaisyComponentNode, VNode } from "../src/types.ts";

const SECTION_IDS = [
  "section-hero",
  "section-features",
  "section-cta",
  "section-reviews",
  "section-numbers",
  "section-footer",
];

const out = process.argv[2] ?? "/tmp/sections.html";
const css = process.argv[3] ?? "https://theweekendprojects.com/styles/emvb-daisyui.css";

let n = 0;
const id = () => `pv${String(++n).padStart(6, "0")}`;
const parts = SECTION_IDS.map((sectionId) => {
  const recipe = DAISY_RECIPES.find((r) => r.id === sectionId);
  if (!recipe) throw new Error(`missing recipe ${sectionId}`);
  // A container's children are rendered first and handed to its build, as the editor's renderer does.
  const toVNode = (node: DaisyComponentNode): VNode =>
    daisyUIProvider.render(node, {}, (node.children ?? []).map(toVNode), { mode: "public" });
  const body = recipe
    .create(id)
    .map((node) => serialize(toVNode(node) as never))
    .join("");
  return `<section class="shot" data-shot="${sectionId}" style="padding:24px 16px">${body}</section>`;
});

writeFileSync(
  out,
  `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${css}">
<style>body{background:#0f0f1a;color:#fff;margin:0}.shot{max-width:1200px;margin:0 auto}</style>
</head><body>${parts.join("\n")}</body></html>`,
);
console.log(`wrote ${out} with ${SECTION_IDS.length} sections`);
