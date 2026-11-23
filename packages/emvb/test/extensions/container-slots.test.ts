import { beforeEach, describe, expect, test } from "bun:test";
import { emptyDesign } from "../../src/core/schema/design.ts";
import { LAYOUT_SCHEMA_VERSION, type Layout, isParentNode } from "../../src/core/schema/layout.ts";
import { renderPage } from "../../src/core/render/index.ts";
import { defineExtension } from "../../src/core/extensions/define.ts";
import { isContainerExtensionType } from "../../src/core/extensions/containers.ts";
import { clearExtensions, rememberExtensions } from "../../src/core/extensions/registry.ts";
import { SLOT_TAG } from "../../src/core/extensions/markup.ts";
import { newElement } from "../../src/admin/editor/dnd/new-element.ts";

const BOX = "ext:emvb-ext-frame/box";
const LEAF = "ext:emvb-ext-frame/leaf";

/** A package with a container (`box`) and a leaf (`leaf`), each with the given output. */
function register(box: unknown, leaf?: unknown) {
  rememberExtensions([
    defineExtension({
      id: "emvb-ext-frame",
      elements: [
        {
          name: "box",
          label: "Box",
          container: true,
          schema: { type: "object", properties: {} },
          fields: [],
          render: (() => box) as never,
        },
        {
          name: "leaf",
          label: "Leaf",
          schema: { type: "object", properties: {} },
          fields: [],
          render: (() => leaf ?? { markup: { tag: "p", attrs: {}, children: ["leaf"] } }) as never,
        },
      ],
    }),
  ]);
}

const para = (id: string, text: string) => ({
  id,
  type: "text",
  props: { text },
});

/** A page with one container holding `children`. */
const withBox = (children: unknown[], type = BOX): Layout => ({
  schemaVersion: LAYOUT_SCHEMA_VERSION,
  root: {
    id: "root0001",
    type: "container",
    props: {},
    children: [{ id: "box00001", type, props: {}, children }],
  } as never,
});

const html = (layout: Layout) => renderPage(layout, emptyDesign(), { mode: "public" }).html;

beforeEach(() => clearExtensions());

describe("new elements from the Add panel", () => {
  test("a new container starts with an empty children array", () => {
    register({ markup: { tag: "div", attrs: {}, children: [] } });
    const node = newElement(BOX, () => 0.5);
    expect(node && "children" in node && Array.isArray(node.children)).toBe(true);
  });

  test("a new leaf starts without a children array", () => {
    register({ markup: { tag: "div", attrs: {}, children: [] } });
    const node = newElement(LEAF, () => 0.5);
    expect(node && "children" in node).toBe(false);
  });
});

describe("container elements", () => {
  test("only a container element is a parent node", () => {
    register({ markup: { tag: "div", attrs: {}, children: [] } });
    expect(isContainerExtensionType(BOX)).toBe(true);
    expect(isContainerExtensionType(LEAF)).toBe(false);
    const box = withBox([]).root.children?.[0];
    if (!box) throw new Error("the test page has no container");
    expect(isParentNode(box as never)).toBe(true);
    expect(isParentNode({ id: "leaf0001", type: LEAF, props: {}, children: [] } as never)).toBe(
      false,
    );
  });

  test("children fill the slot, in order", () => {
    register({
      markup: {
        tag: "section",
        attrs: {},
        children: [{ tag: "h2", attrs: {}, children: ["Title"] }, SLOT_NODE()],
      },
    });
    const out = html(withBox([para("p1", "first"), para("p2", "second")]));
    expect(out).toContain("<section>");
    expect(out.indexOf("Title")).toBeLessThan(out.indexOf("first"));
    expect(out.indexOf("first")).toBeLessThan(out.indexOf("second"));
  });

  test("only the first slot gets the children; later markers are removed", () => {
    register({
      markup: {
        tag: "div",
        attrs: {},
        children: [SLOT_NODE(), SLOT_NODE()],
      },
    });
    const out = html(withBox([para("p1", "once")]));
    expect(out.split("once").length - 1).toBe(1);
  });

  test("children with no slot are appended after the markup", () => {
    register({ markup: { tag: "div", attrs: {}, children: ["header"] } });
    const out = html(withBox([para("p1", "tail")]));
    expect(out.indexOf("header")).toBeLessThan(out.indexOf("tail"));
  });

  test("the slot marker never reaches the page", () => {
    register({ markup: { tag: "div", attrs: {}, children: [SLOT_NODE()] } });
    expect(html(withBox([]))).not.toContain(SLOT_TAG);
    expect(html(withBox([para("p1", "x")]))).not.toContain(SLOT_TAG);
  });

  test("a leaf ignores stored children", () => {
    register(undefined, { markup: { tag: "p", attrs: {}, children: ["leaf"] } });
    const layout: Layout = {
      schemaVersion: LAYOUT_SCHEMA_VERSION,
      root: {
        id: "root0001",
        type: "container",
        props: {},
        children: [
          { id: "leaf0001", type: LEAF, props: {}, children: [para("p1", "hidden")] } as never,
        ],
      },
    };
    const out = html(layout);
    expect(out).toContain("leaf");
    expect(out).not.toContain("hidden");
  });

  test("the element is told how many children it holds", () => {
    rememberExtensions([
      defineExtension({
        id: "emvb-ext-frame",
        elements: [
          {
            name: "box",
            label: "Box",
            container: true,
            schema: { type: "object", properties: {} },
            fields: [],
            render: (_props, ctx) => ({
              markup: { tag: "p", attrs: {}, children: [`count ${ctx.childCount ?? 0}`] },
            }),
          },
        ],
      }),
    ]);
    expect(html(withBox([para("p1", "a"), para("p2", "b")]))).toContain("count 2");
    expect(html(withBox([]))).toContain("count 0");
  });
});

/** A slot marker, as an extension writes it inside its markup. */
function SLOT_NODE() {
  return { tag: SLOT_TAG, attrs: {}, children: [] };
}
