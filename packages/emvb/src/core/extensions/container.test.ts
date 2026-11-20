import { beforeEach, describe, expect, test } from "bun:test";
import { emptyDesign } from "../schema/design.ts";
import {
  isParentNode,
  LAYOUT_SCHEMA_VERSION,
  type Layout,
  type LayoutNode,
} from "../schema/layout.ts";
import { renderPage } from "../render/index.ts";
import { defineExtension } from "./define.ts";
import { clearExtensions, rememberExtensions } from "./registry.ts";
import { fillSlot, SLOT_TAG } from "./markup.ts";
import type { ExtensionRenderContext } from "./types.ts";

const CARD = "ext:emvb-ext-box/card";
const LEAF = "ext:emvb-ext-box/tag";

const box = (slots: number) =>
  defineExtension({
    id: "emvb-ext-box",
    label: "Box",
    classes: ["card", "card-body"],
    elements: [
      {
        name: "card",
        label: "Card",
        container: true,
        schema: { type: "object", properties: {} },
        fields: [],
        render: () => ({
          markup: {
            tag: "div",
            attrs: { class: "card" },
            children: [
              {
                tag: "div",
                attrs: { class: "card-body" },
                children: Array.from({ length: slots }, () => ({
                  tag: SLOT_TAG,
                  attrs: {},
                  children: [],
                })),
              },
            ],
          },
        }),
      },
      {
        name: "tag",
        label: "Tag",
        schema: { type: "object", properties: {} },
        fields: [],
        render: () => ({ id: "tag00001", type: "heading", props: { text: "Tag", level: 3 } }),
      },
      {
        name: "probe",
        label: "Probe",
        container: true,
        schema: { type: "object", properties: {} },
        fields: [],
        render: (_props: Record<string, unknown>, ctx: ExtensionRenderContext) => ({
          markup: { tag: "p", attrs: {}, children: [`count ${ctx.childCount ?? "none"}`] },
        }),
      },
    ],
  });
const PROBE = "ext:emvb-ext-box/probe";

const heading = (id: string, text: string): LayoutNode => ({
  id,
  type: "heading",
  props: { text, level: 3 },
});

const pageWith = (type: string, children: LayoutNode[]): Layout => ({
  schemaVersion: LAYOUT_SCHEMA_VERSION,
  root: {
    id: "root0001",
    type: "container",
    props: {},
    children: [{ id: "ext00001", type, props: {}, children }],
  },
});

beforeEach(() => {
  clearExtensions();
});

describe("container extension elements (W-927, extensionApi 1.x)", () => {
  test("only elements flagged container are parents", () => {
    rememberExtensions([box(1)]);
    expect(isParentNode({ id: "a", type: CARD, props: {}, children: [] } as LayoutNode)).toBe(true);
    expect(isParentNode({ id: "b", type: LEAF, props: {}, children: [] } as LayoutNode)).toBe(
      false,
    );
  });

  test("children fill the slot inside the element's markup, in order", () => {
    rememberExtensions([box(1)]);
    const result = renderPage(
      pageWith(CARD, [heading("h0000001", "First"), heading("h0000002", "Second")]),
      emptyDesign(),
      { mode: "public" },
    );
    const card = result.html.indexOf("card-body");
    expect(card).toBeGreaterThan(-1);
    expect(result.html.indexOf("First")).toBeGreaterThan(card);
    expect(result.html.indexOf("Second")).toBeGreaterThan(result.html.indexOf("First"));
    expect(result.html).not.toContain(SLOT_TAG);
  });

  test("a leaf element does not render stored children", () => {
    rememberExtensions([box(1)]);
    const result = renderPage(
      pageWith(LEAF, [heading("h0000003", "Hidden child")]),
      emptyDesign(),
      {
        mode: "public",
      },
    );
    expect(result.html).not.toContain("Hidden child");
  });

  test("children with no slot marker are appended after the markup", () => {
    rememberExtensions([box(0)]);
    const result = renderPage(pageWith(CARD, [heading("h0000004", "After")]), emptyDesign(), {
      mode: "public",
    });
    expect(result.html.indexOf("After")).toBeGreaterThan(result.html.indexOf("card-body"));
  });

  test("only the first slot marker receives children", () => {
    rememberExtensions([box(2)]);
    const result = renderPage(pageWith(CARD, [heading("h0000005", "Once")]), emptyDesign(), {
      mode: "public",
    });
    expect(result.html.split("Once").length - 1).toBe(1);
  });

  test("the element is told how many children it holds", () => {
    rememberExtensions([box(1)]);
    const two = renderPage(
      pageWith(PROBE, [heading("h0000006", "A"), heading("h0000007", "B")]),
      emptyDesign(),
      { mode: "public" },
    );
    expect(two.html).toContain("count 2");
    const none = renderPage(pageWith(PROBE, []), emptyDesign(), { mode: "public" });
    expect(none.html).toContain("count 0");
  });

  test("a stored container saved without a children array renders as a leaf", () => {
    rememberExtensions([box(1)]);
    const saved = {
      schemaVersion: LAYOUT_SCHEMA_VERSION,
      root: {
        id: "root0001",
        type: "container",
        props: {},
        children: [{ id: "ext00001", type: CARD, props: {} }],
      },
    } as unknown as Layout;
    expect(isParentNode({ id: "ext00001", type: CARD, props: {} } as LayoutNode)).toBe(false);
    expect(() => renderPage(saved, emptyDesign(), { mode: "public" })).not.toThrow();
  });

  test("a package with 40 elements registers all of them, not just the first 32", () => {
    const many = defineExtension({
      id: "emvb-ext-many",
      label: "Many",
      elements: Array.from({ length: 40 }, (_, i) => ({
        name: `el${i}`,
        label: `El ${i}`,
        schema: { type: "object" as const, properties: {} },
        fields: [],
        render: () => ({
          id: `m${String(i).padStart(7, "0")}`,
          type: "heading",
          props: { text: "x", level: 3 },
        }),
      })),
    });
    const [manifest] = rememberExtensions([many]);
    expect(manifest?.elements).toHaveLength(40);
  });

  test("fillSlot reports children that found no marker", () => {
    const child = { tag: "p", attrs: {}, children: ["x"] };
    const root = { tag: "div", attrs: {}, children: [{ tag: "span", attrs: {}, children: [] }] };
    expect(fillSlot(root, [child])).toEqual({ root, unused: [child] });
  });
});
