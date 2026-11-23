/**
 * Cases the other extension tests did not reach: the caps, the attributes the markup check drops,
 * the id references, nested containers, and the node output's children. One test per case.
 */
import { beforeEach, describe, expect, test } from "bun:test";
import { emptyDesign } from "../../src/core/schema/design.ts";
import { LAYOUT_SCHEMA_VERSION, type Layout } from "../../src/core/schema/layout.ts";
import { renderPage } from "../../src/core/render/index.ts";
import { defineExtension } from "../../src/core/extensions/define.ts";
import {
  clearExtensions,
  liveElement,
  rememberExtensions,
} from "../../src/core/extensions/registry.ts";
import { SLOT_TAG } from "../../src/core/extensions/markup.ts";
import { isContainerExtensionType } from "../../src/core/extensions/containers.ts";
import { EXTENSION_PLACEHOLDER_TEXT } from "../../src/core/extensions/placeholder.ts";

const PROPS = { type: "object" as const, properties: {} };
const BOX = "ext:emvb-ext-cases/box";
const INNER = "ext:emvb-ext-cases/inner";
const RAW = "ext:emvb-ext-cases/raw";

/** One package with a container, an inner container, and an element that returns `raw` as-is. */
function register(raw: () => unknown) {
  rememberExtensions([
    defineExtension({
      id: "emvb-ext-cases",
      elements: [
        {
          name: "box",
          label: "Box",
          container: true,
          schema: PROPS,
          fields: [],
          render: (() => ({
            markup: {
              tag: "div",
              attrs: {},
              children: [{ tag: SLOT_TAG, attrs: {}, children: [] }],
            },
          })) as never,
        },
        {
          name: "inner",
          label: "Inner",
          container: true,
          schema: PROPS,
          fields: [],
          render: (() => ({
            markup: {
              tag: "section",
              attrs: {},
              children: [{ tag: SLOT_TAG, attrs: {}, children: [] }],
            },
          })) as never,
        },
        {
          name: "raw",
          label: "Raw",
          schema: PROPS,
          fields: [],
          render: raw as never,
        },
      ],
    }),
  ]);
}

const layoutWith = (
  type: string,
  props: Record<string, unknown> = {},
  children?: unknown[],
): Layout => ({
  schemaVersion: LAYOUT_SCHEMA_VERSION,
  root: {
    id: "root0001",
    type: "container",
    props: {},
    children: [{ id: "node0001", type, props, ...(children ? { children } : {}) }],
  } as never,
});

const html = (layout: Layout, mode: "public" | "editor" = "public") =>
  renderPage(layout, emptyDesign(), { mode }).html;
/** The placeholder shows only when asked for (W-1088: visitors get nothing). */
const placeholderHtml = (layout: Layout) =>
  renderPage(layout, emptyDesign(), { mode: "public", extensionPlaceholders: true }).html;

const para = (id: string, text: string) => ({ id, type: "text", props: { text } });

beforeEach(() => clearExtensions());

describe("the markup check drops what it cannot allow", () => {
  test("a style attribute is dropped, the element keeps its text", () => {
    register(() => ({ markup: { tag: "p", attrs: { style: "color:red" }, children: ["plain"] } }));
    const out = html(layoutWith(RAW));
    expect(out).toContain("plain");
    expect(out).not.toContain("style=");
    expect(out).not.toContain("color:red");
  });

  test("an xlink:href with a script URL is dropped", () => {
    register(() => ({
      markup: { tag: "a", attrs: { "xlink:href": "javascript:alert(1)" }, children: ["svg link"] },
    }));
    const out = html(layoutWith(RAW));
    expect(out).toContain("svg link");
    expect(out).not.toContain("javascript:");
  });

  test("an img src that is not http(s) is dropped, the image stays", () => {
    register(() => ({
      markup: { tag: "img", attrs: { src: "javascript:alert(1)", alt: "pic" }, children: [] },
    }));
    const out = html(layoutWith(RAW));
    expect(out).toContain('alt="pic"');
    expect(out).not.toContain("javascript:");
  });

  test("an aria id list with a bad id is dropped", () => {
    register(() => ({
      markup: { tag: "div", attrs: { "aria-labelledby": "ok bad<id" }, children: ["x"] },
    }));
    const out = html(layoutWith(RAW));
    expect(out).toContain("x");
    expect(out).not.toContain("aria-labelledby");
  });

  test("a deeper tree than the limit shows the placeholder", () => {
    let node: { tag: string; attrs: object; children: unknown[] } = {
      tag: "span",
      attrs: {},
      children: ["deep"],
    };
    for (let i = 0; i < 14; i++) node = { tag: "div", attrs: {}, children: [node] };
    register(() => ({ markup: node }));
    expect(placeholderHtml(layoutWith(RAW))).toContain(EXTENSION_PLACEHOLDER_TEXT);
  });

  test("a tree over the node limit shows the placeholder", () => {
    const children = Array.from({ length: 220 }, (_, i) => ({
      tag: "span",
      attrs: {},
      children: [`n${i}`],
    }));
    register(() => ({ markup: { tag: "div", attrs: {}, children } }));
    expect(placeholderHtml(layoutWith(RAW))).toContain(EXTENSION_PLACEHOLDER_TEXT);
  });
});

describe("ids in markup", () => {
  test("for and popovertarget ids are scoped with the element", () => {
    register(() => ({
      markup: {
        tag: "div",
        attrs: {},
        children: [
          { tag: "input", attrs: { id: "field-one" }, children: [] },
          { tag: "label", attrs: { for: "field-one" }, children: ["Name"] },
          { tag: "button", attrs: { popovertarget: "menu" }, children: ["Open"] },
          { tag: "div", attrs: { id: "menu", popover: "auto" }, children: ["menu"] },
        ],
      },
    }));
    const out = html(layoutWith(RAW, {}), "public");
    expect(out).toContain('for="ext-node0001-field-one"');
    expect(out).toContain('popovertarget="ext-node0001-menu"');
    expect(out).toContain('id="ext-node0001-menu"');
  });
});

describe("containers", () => {
  test("a container inside a container: each takes its own children", () => {
    register(() => ({ markup: { tag: "p", attrs: {}, children: [] } }));
    const layout: Layout = {
      schemaVersion: LAYOUT_SCHEMA_VERSION,
      root: {
        id: "root0001",
        type: "container",
        props: {},
        children: [
          {
            id: "box00001",
            type: BOX,
            props: {},
            children: [
              {
                id: "inr00001",
                type: INNER,
                props: {},
                children: [para("deep00001", "deep text")],
              },
              para("top00001", "top text"),
            ],
          } as never,
        ],
      },
    };
    const out = html(layout);
    expect(out).toContain("deep text");
    expect(out).toContain("top text");
    expect(out.indexOf("deep text")).toBeLessThan(out.indexOf("top text"));
    expect(out).not.toContain(SLOT_TAG);
  });

  test("a container's children keep their own classes (they are not filtered)", () => {
    register(() => ({ markup: { tag: "p", attrs: {}, children: [] } }));
    const child = { id: "txt00001", type: "text", props: { text: "styled" } };
    const out = html(layoutWith(BOX, {}, [child]));
    expect(out).toContain("styled");
    expect(out).toContain("emvb-");
  });

  test("a node output (not markup) appends the children after its nodes", () => {
    rememberExtensions([
      defineExtension({
        id: "emvb-ext-cases",
        elements: [
          {
            name: "box",
            label: "Box",
            container: true,
            schema: PROPS,
            fields: [],
            render: (() => [
              { id: "head0001", type: "heading", props: { text: "Head", level: 2 } },
            ]) as never,
          },
        ],
      }),
    ]);
    const out = html(layoutWith(BOX, {}, [para("tail0001", "after")]));
    expect(out.indexOf("Head")).toBeLessThan(out.indexOf("after"));
  });

  test("a container whose stored node has no children array is a leaf in the editor", () => {
    register(() => ({ markup: { tag: "p", attrs: {}, children: [] } }));
    expect(isContainerExtensionType(BOX)).toBe(true);
    const out = html(layoutWith(BOX), "editor");
    expect(out).not.toContain(EXTENSION_PLACEHOLDER_TEXT);
  });
});

describe("limits and registration", () => {
  test("a package may register up to 128 elements; beyond that they are not registered", () => {
    const elements = Array.from({ length: 130 }, (_, i) => ({
      name: `e${i}`,
      label: `E${i}`,
      schema: PROPS,
      fields: [],
      render: (() => ({ markup: { tag: "p", attrs: {}, children: [] } })) as never,
    }));
    rememberExtensions([defineExtension({ id: "emvb-ext-many", elements })]);
    expect(liveElement("ext:emvb-ext-many/e127")).toBeDefined();
    expect(liveElement("ext:emvb-ext-many/e128")).toBeUndefined();
  });

  test("accepts implies container", () => {
    rememberExtensions([
      defineExtension({
        id: "emvb-ext-cases",
        elements: [
          {
            name: "bullets",
            label: "Bullets",
            accepts: ["item"],
            schema: PROPS,
            fields: [],
            render: (() => ({
              markup: {
                tag: "ul",
                attrs: {},
                children: [{ tag: SLOT_TAG, attrs: {}, children: [] }],
              },
            })) as never,
          },
          {
            name: "item",
            label: "Item",
            part: true,
            schema: PROPS,
            fields: [],
            render: (() => ({ markup: { tag: "li", attrs: {}, children: ["i"] } })) as never,
          },
        ],
      }),
    ]);
    expect(isContainerExtensionType("ext:emvb-ext-cases/bullets")).toBe(true);
    // `list` is a built-in node type, so it is not a legal element name (1.4 rule).
  });
});

describe("the editor's render route", () => {
  test("markup comes back as markup, nodes as nodes, a missing element as null", async () => {
    const { extensionRenderRoute } = await import("../../src/server/extension-routes.ts");
    register(() => ({ markup: { tag: "p", attrs: {}, children: ["route text"] } }));
    const handler = extensionRenderRoute.handler as unknown as (ctx: unknown) => Promise<{
      outputs: { key: string; markup?: unknown; nodes: unknown }[];
    }>;
    const result = await handler({
      input: {
        mode: "editor",
        nodes: [
          { type: RAW, props: {} },
          { type: "ext:emvb-ext-cases/missing", props: {} },
        ],
      },
    });
    const [present, missing] = result.outputs;
    expect(present?.markup).toBeDefined();
    // Markup comes back without a nodes key (the admin reads `markup` then); a missing element has null nodes.
    expect(present?.nodes).toBeUndefined();
    expect(missing?.nodes).toBeNull();
    expect(missing?.markup).toBeUndefined();
  });

  test("the element is told the mode the route was asked for", async () => {
    const { extensionRenderRoute } = await import("../../src/server/extension-routes.ts");
    rememberExtensions([
      defineExtension({
        id: "emvb-ext-cases",
        elements: [
          {
            name: "raw",
            label: "Raw",
            schema: PROPS,
            fields: [],
            render: ((_p: unknown, ctx: { mode: string }) => ({
              markup: { tag: "p", attrs: {}, children: [ctx.mode] },
            })) as never,
          },
        ],
      }),
    ]);
    const handler = extensionRenderRoute.handler as unknown as (ctx: unknown) => Promise<{
      outputs: { markup?: { children: string[] } }[];
    }>;
    const asPublic = await handler({
      input: { mode: "public", nodes: [{ type: RAW, props: {} }] },
    });
    const asEditor = await handler({
      input: { mode: "editor", nodes: [{ type: RAW, props: {} }] },
    });
    expect(asPublic.outputs[0]?.markup?.children).toEqual(["public"]);
    expect(asEditor.outputs[0]?.markup?.children).toEqual(["editor"]);
  });
});

describe("instances of one element on the canvas and in the export (gap 5)", () => {
  test("two identical instances get their own scoped ids, through the route and the editor fallback", async () => {
    const { extensionRenderRoute } = await import("../../src/server/extension-routes.ts");
    const { extensionOutputKey } = await import("../../src/core/extensions/render-ext.ts");
    register(() => ({ markup: { tag: "div", attrs: { id: "item" }, children: [] } }));
    const handler = extensionRenderRoute.handler as unknown as (ctx: unknown) => Promise<{
      outputs: { key: string; markup?: unknown }[];
    }>;
    const a = { type: RAW, props: {}, id: "aaaa0001" };
    const b = { type: RAW, props: {}, id: "bbbb0002" };
    const result = await handler({ input: { mode: "editor", nodes: [a, b] } });
    const [outA, outB] = result.outputs;
    expect(JSON.stringify(outA?.markup)).toContain('"id":"ext-aaaa0001-item"');
    expect(JSON.stringify(outB?.markup)).toContain('"id":"ext-bbbb0002-item"');
    expect(outA?.key).not.toEqual(outB?.key);

    // The canvas draws the two nodes from those outputs: the ids must still be unique on the page.
    const layout: Layout = {
      schemaVersion: LAYOUT_SCHEMA_VERSION,
      root: {
        id: "root0001",
        type: "container",
        props: {},
        children: [
          { id: "aaaa0001", type: RAW, props: {} },
          { id: "bbbb0002", type: RAW, props: {} },
        ],
      } as never,
    };
    const outputs = new Map<string, unknown>([
      [extensionOutputKey(a), { markup: outA?.markup }],
      [extensionOutputKey(b), { markup: outB?.markup }],
    ]);
    const canvas = renderPage(layout, emptyDesign(), {
      mode: "editor",
      extensionOutputs: outputs,
    }).html;
    expect(canvas).toContain('id="ext-aaaa0001-item"');
    expect(canvas).toContain('id="ext-bbbb0002-item"');
    expect(canvas.match(/id="ext-aaaa0001-item"/g)?.length).toBe(1);
  });
});

describe("list parts share a group only inside their container (gap 2)", () => {
  test("two tab containers on one page: tabs share a radio group within a container, not across", () => {
    clearExtensions();
    rememberExtensions([
      defineExtension({
        id: "emvb-ext-cases",
        elements: [
          {
            name: "tab-list",
            label: "Tab list",
            container: true,
            accepts: ["tab"],
            schema: PROPS,
            fields: [],
            render: (() => ({
              markup: {
                tag: "div",
                attrs: {},
                children: [{ tag: SLOT_TAG, attrs: {}, children: [] }],
              },
            })) as never,
          },
          {
            name: "tab",
            label: "Tab",
            part: true,
            schema: PROPS,
            fields: [],
            render: ((props: { text?: string }) => ({
              markup: {
                tag: "input",
                attrs: { type: "radio", name: "tabs", "aria-label": props.text ?? "Tab" },
                children: [],
              },
            })) as never,
          },
        ],
      }),
    ]);
    const tab = (id: string, text: string) => ({
      id,
      type: "ext:emvb-ext-cases/tab",
      props: { text },
    });
    const layout: Layout = {
      schemaVersion: LAYOUT_SCHEMA_VERSION,
      root: {
        id: "root0001",
        type: "container",
        props: {},
        children: [
          {
            id: "tabsA0001",
            type: "ext:emvb-ext-cases/tab-list",
            props: {},
            children: [tab("tabA0001", "One"), tab("tabA0002", "Two")],
          } as never,
          {
            id: "tabsB0002",
            type: "ext:emvb-ext-cases/tab-list",
            props: {},
            children: [tab("tabB0001", "Three"), tab("tabB0002", "Four")],
          } as never,
        ],
      },
    };
    const page = renderPage(layout, emptyDesign(), { mode: "public" }).html;
    const names = [...page.matchAll(/name="([^"]+)"/g)].map((m) => m[1]);
    expect(names).toHaveLength(4);
    expect(names[0]).toBe(names[1]);
    expect(names[2]).toBe(names[3]);
    expect(names[0]).not.toBe(names[2]);
    expect(names[0]).toContain("ext-tabsA0001");
    expect(names[2]).toContain("ext-tabsB0002");
  });
});
