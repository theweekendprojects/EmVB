import { beforeEach, describe, expect, test } from "bun:test";
import { parentChildRefusal, REASONS } from "../arrange.ts";
import { emptyDesign } from "../schema/design.ts";
import { LAYOUT_SCHEMA_VERSION, type Layout, type LayoutNode } from "../schema/layout.ts";
import { renderPage } from "../render/index.ts";
import { defineExtension } from "./define.ts";
import { clearExtensions, rememberExtensions } from "./registry.ts";
import { SLOT_TAG } from "./markup.ts";

const PROPS = { type: "object" as const, properties: {} };
const list = defineExtension({
  id: "emvb-ext-list",
  label: "List",
  elements: [
    {
      name: "bullets",
      label: "Menu",
      container: true,
      accepts: ["bullet"],
      schema: PROPS,
      fields: [],
      render: () => ({
        markup: { tag: "ul", attrs: {}, children: [{ tag: SLOT_TAG, attrs: {}, children: [] }] },
      }),
    },
    {
      name: "card",
      label: "Card",
      container: true,
      schema: PROPS,
      fields: [],
      render: () => ({
        markup: { tag: "div", attrs: {}, children: [{ tag: SLOT_TAG, attrs: {}, children: [] }] },
      }),
    },
    {
      name: "bullet",
      label: "Item",
      part: true,
      schema: PROPS,
      fields: [],
      render: () => ({ markup: { tag: "li", attrs: {}, children: ["Item"] } }),
    },
  ],
});

const node = (id: string, type: string): LayoutNode => ({ id, type, props: {} }) as LayoutNode;
const MENU = node("menu0001", "ext:emvb-ext-list/bullets");
const CARD = node("card0001", "ext:emvb-ext-list/card");
const ITEM = node("item0001", "ext:emvb-ext-list/bullet");
const HEADING = { id: "head0001", type: "heading", props: { text: "x", level: 3 } } as LayoutNode;

beforeEach(() => {
  clearExtensions();
  rememberExtensions([list]);
});

describe("list parts (extensionApi 1.x, additive)", () => {
  test("a list accepts its item", () => {
    expect(parentChildRefusal(MENU, ITEM, false)).toBeUndefined();
  });

  test("a list refuses anything it does not accept", () => {
    expect(parentChildRefusal(MENU, HEADING, false)).toBe(REASONS.extensionNotAccepted);
  });

  test("an item cannot go into a container that does not list it", () => {
    expect(parentChildRefusal(CARD, ITEM, false)).toBe(REASONS.partOutsideParent);
  });

  test("a plain container still takes ordinary children", () => {
    expect(parentChildRefusal(CARD, HEADING, false)).toBeUndefined();
  });

  test("an item renders without the element wrapper, so it sits in its list", () => {
    const page: Layout = {
      schemaVersion: LAYOUT_SCHEMA_VERSION,
      root: {
        id: "root0001",
        type: "container",
        props: {},
        children: [
          {
            id: "menu0001",
            type: "ext:emvb-ext-list/bullets",
            props: {},
            children: [{ id: "item0001", type: "ext:emvb-ext-list/bullet", props: {} }],
          },
        ],
      },
    } as Layout;
    const result = renderPage(page, emptyDesign(), { mode: "public" });
    expect(result.html).toContain('data-emvb-ext="ext:emvb-ext-list/bullet"');
    // The item is the list's direct child: no wrapper div between <ul> and <li>.
    expect(result.html).toMatch(/<ul[^>]*><li/);
  });
});
