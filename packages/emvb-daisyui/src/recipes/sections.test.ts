import { describe, expect, test } from "bun:test";
import { serialize } from "../../../emvb/src/core/render/vnode.ts";
import { ProviderNode } from "../../../emvb/src/core/schema/layout.ts";
import { daisyUIProvider } from "../provider.ts";
import { DAISY_RECIPES } from "./index.ts";
import type { DaisyComponentNode } from "../types.ts";

// The six sections a site owner starts from. They must be first, render safely, and read as
// plain placeholder text rather than empty boxes or internal jargon.
const SECTION_IDS = [
  "section-hero",
  "section-features",
  "section-cta",
  "section-reviews",
  "section-numbers",
  "section-footer",
] as const;

const sections = DAISY_RECIPES.slice(0, SECTION_IDS.length);
const build = (id: string) => {
  let n = 0;
  const recipe = DAISY_RECIPES.find((r) => r.id === id);
  if (!recipe) throw new Error(`missing recipe ${id}`);
  return recipe.create(() => `sc${String(++n).padStart(6, "0")}`);
};

// Visible text of a node tree, from its props and children.
const textOf = (node: DaisyComponentNode): string =>
  [
    ...Object.values(node.props).filter((v): v is string => typeof v === "string"),
    ...(node.children ?? []).map(textOf),
  ].join(" ");

// Props a non-technical reader sees as headings or labels must never be blank.
const READABLE_KEYS = ["title", "brand", "label", "action", "value"] as const;

describe("site sections for non-technical owners", () => {
  test("the six sections are the first recipes, in order", () => {
    expect(sections.map((r) => r.id)).toEqual([...SECTION_IDS]);
  });

  test("each section has a plain name and description", () => {
    for (const recipe of sections) {
      expect(recipe.name.length, recipe.id).toBeGreaterThan(2);
      expect(recipe.description.length, recipe.id).toBeGreaterThan(20);
      expect(recipe.description, recipe.id).not.toMatch(/component|prop|class|node|lorem/i);
    }
  });

  test("no visible label or heading is left blank", () => {
    for (const id of SECTION_IDS) {
      const walk = (nodes: DaisyComponentNode[]) => {
        for (const node of nodes) {
          for (const key of READABLE_KEYS) {
            if (key in node.props) {
              expect(String(node.props[key]).trim(), `${id} ${node.component}.${key}`).not.toBe("");
            }
          }
          if (node.children) walk(node.children);
        }
      };
      walk(build(id));
    }
  });

  test("the placeholder words never leak internal names or lorem text", () => {
    for (const id of SECTION_IDS) {
      for (const node of build(id)) {
        expect(textOf(node), id).not.toMatch(/lorem|undefined|\[object/i);
      }
    }
  });

  test("each section passes the layout schema and renders through the output allowlist", () => {
    for (const id of SECTION_IDS) {
      for (const node of build(id)) {
        const parsed = ProviderNode.safeParse({
          id: node.id,
          type: node.type,
          provider: "daisyui",
          component: node.component,
          props: node.props,
          children: [],
        });
        expect(parsed.success, `${id}: ${JSON.stringify(parsed.error?.issues[0])}`).toBe(true);
        expect(() => serialize(daisyUIProvider.render(node, {}, [], { mode: "public" }) as never)).not.toThrow();
      }
    }
  });

  test("features, reviews and key numbers are one three-column grid, not a stack", () => {
    for (const id of ["section-features", "section-reviews", "section-numbers"] as const) {
      const [grid] = build(id);
      expect(grid?.component, id).toBe("columns");
      expect(grid?.props.columns, id).toBe("3");
      expect(grid?.children?.length, id).toBe(3);
    }
  });

  test("the call to action keeps its button at natural width, not stretched across the card", () => {
    const [cta] = build("section-cta");
    expect(cta?.props.align).toBe("center");
    expect(serialize(daisyUIProvider.render(cta!, {}, [], { mode: "public" }) as never)).toContain(
      'class="card-body items-center text-center"',
    );
  });

  test("the footer's links are real, safe paths", () => {
    const [footer] = build("section-footer");
    expect(footer?.props.links).toContain("|/about");
    expect(String(footer?.props.links)).not.toContain("javascript:");
  });
});
