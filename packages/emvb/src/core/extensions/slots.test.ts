import { beforeEach, describe, expect, test } from "bun:test";
import { emptyDesign } from "../schema/design.ts";
import { LAYOUT_SCHEMA_VERSION, type Layout } from "../schema/layout.ts";
import { renderPage } from "../render/index.ts";
import { defineExtension } from "./define.ts";
import { clearExtensions, liveElement, rememberExtensions } from "./registry.ts";
import { safeExtensionOutput } from "./safe-nodes.ts";
import { slotNameOf } from "./slots.ts";
import { validateLayout } from "../validate.ts";
import { addNode, canDrop, moveNode, REASONS } from "../arrange.ts";
import { findNode, nodeChildren, removeNode } from "../tree-ops.ts";
import { canHoldChild, clearSlotRules, holdsChildren, setSlotRules } from "./slot-rules.ts";
import type { ExtensionOutputNode } from "./types.ts";

const PKG = "emvb-ext-cards";
const CARD = `ext:${PKG}/card`;
const TWO = `ext:${PKG}/two`;
const TABS = `ext:${PKG}/tab-set`;
const PANEL = `ext:${PKG}/tab-pane`;

/** An element with one slot named `body`. Its output marks where the stored children go. */
const element = (name: string, slots: { name: string; accepts?: string[] }[], output: string) => ({
  name,
  label: name,
  schema: { type: "object" as const, properties: {} },
  fields: [],
  defaults: () => ({}),
  slots: slots.map((s) => ({ label: s.name, ...s })),
  render: (): ExtensionOutputNode[] => [{ type: "ext-slot", name: output }],
});

const cards = () =>
  defineExtension({
    id: PKG,
    label: "Cards",
    elements: [
      element("card", [{ name: "body", accepts: ["text"] }], "body"),
      element("two", [{ name: "a" }, { name: "b" }], "a"),
      element("undeclared", [{ name: "body" }], "other"),
      { ...element("tab-set", [{ name: "body" }], "body"), parts: ["tab-pane"] },
      element("tab-pane", [{ name: "body" }], "body"),
      {
        // A marker nested in a container: it compiles without a cast.
        ...element("boxed", [{ name: "body" }], "body"),
        render: (): ExtensionOutputNode[] => [
          {
            id: "box00001",
            type: "container",
            props: {},
            children: [{ type: "ext-slot", name: "body" }],
          },
        ],
      },
      {
        // The extension's own output has an id and a link to it; its slot holds the author's content.
        ...element("framed", [{ name: "body" }], "body"),
        render: (): ExtensionOutputNode[] => [
          { type: "markup", props: { tag: "h3", attrs: { id: "title" }, text: "Own title" } },
          { type: "markup", props: { tag: "a", attrs: { href: "#title" }, text: "Own link" } },
          { type: "ext-slot", name: "body" },
        ],
      },
      {
        // A box whose slot holds the author's content, as a kit's `.card-body > h2` expects.
        ...element("body-box", [{ name: "body" }], "body"),
        render: (): ExtensionOutputNode[] => [
          {
            type: "markup",
            props: { tag: "div", attrs: { "data-box": "" } },
            children: [{ type: "ext-slot", name: "body" }],
          },
        ],
      },
    ],
  });

/** A page with one card whose stored children are a heading and a text node. */
const pageWithCard = (type: string): Layout => ({
  schemaVersion: LAYOUT_SCHEMA_VERSION,
  root: {
    id: "root0001",
    type: "container",
    props: {},
    children: [
      {
        id: "card0001",
        type,
        props: {},
        children: [
          { id: "head0001", type: "heading", props: { text: "Skipped", level: 2 } },
          { id: "text0001", type: "text", props: { text: "Kept copy" } },
        ],
      },
    ],
  },
});

beforeEach(() => {
  clearExtensions();
  clearSlotRules();
});

describe("slot markers in output", () => {
  test("a valid marker keeps its name beside the validated node", () => {
    const [node] = safeExtensionOutput([{ type: "ext-slot", name: "body" }]);
    expect(node && slotNameOf(node)).toBe("body");
  });

  test("a marker with a name that is not a slot name is refused", () => {
    expect(safeExtensionOutput([{ type: "ext-slot", name: "Bad Name" }])).toEqual([]);
  });
});

describe("rendering the stored children into the slot", () => {
  test("the children an element declares accepts render in its slot", () => {
    rememberExtensions([cards()]);
    const page = renderPage(pageWithCard(CARD), emptyDesign(), { mode: "public" });
    expect(page.html).toContain("Kept copy");
    // The children sit in the extension's output with no wrapper element of their own.
    expect(page.html).not.toContain("emvb-ext-slot");
  });

  test("a child not on the slot's accepts list does not render", () => {
    rememberExtensions([cards()]);
    const page = renderPage(pageWithCard(CARD), emptyDesign(), { mode: "public" });
    expect(page.html).not.toContain("Skipped");
  });

  test("a marker nested in a container renders the children there", () => {
    rememberExtensions([cards()]);
    const page = renderPage(pageWithCard(`ext:${PKG}/boxed`), emptyDesign(), { mode: "public" });
    expect(page.html).toContain("Kept copy");
    expect(page.html).toContain("Skipped");
  });

  test("with the extension missing, the children stay saved and visitors see nothing", () => {
    const stored = pageWithCard(CARD);
    const page = renderPage(stored, emptyDesign(), { mode: "public" });
    expect(page.html).not.toContain("Kept copy");
    expect(page.html).not.toContain("Skipped");
    expect(validateLayout(stored).ok).toBe(true);
    expect(JSON.stringify(stored)).toContain("Kept copy");
  });

  test("a marker whose name the element does not declare renders nothing", () => {
    rememberExtensions([cards()]);
    const undeclared = pageWithCard(`ext:${PKG}/undeclared`);
    const page = renderPage(undeclared, emptyDesign(), { mode: "public" });
    expect(page.html).not.toContain("Kept copy");
  });
});

describe("manifest declarations", () => {
  test("an element with more than one slot is not registered (1.5 allows one)", () => {
    rememberExtensions([cards()]);
    expect(liveElement(TWO)).toBeUndefined();
    expect(liveElement(CARD)).toBeDefined();
  });

  test("a slot's accepts list is kept as stored types", () => {
    rememberExtensions([cards()]);
    const manifest = liveElement(CARD)?.manifest;
    expect(manifest?.slots?.[0]?.accepts).toEqual(["text"]);
  });
});

describe("drop rules (setSlotRules / canHoldChild)", () => {
  test("only an element with a slot holds children", () => {
    setSlotRules([{ type: CARD, slots: [{}] }]);
    expect(holdsChildren(CARD)).toBe(true);
    expect(holdsChildren("container")).toBe(false);
  });

  test("a part lives only inside the element that lists it", () => {
    setSlotRules([
      { type: TABS, slots: [{}], parts: [PANEL] },
      { type: PANEL, slots: [{}], parts: [] },
    ]);
    expect(canHoldChild(TABS, PANEL)).toBe(true);
    expect(canHoldChild("container", PANEL)).toBe(false);
    expect(canHoldChild(CARD, PANEL)).toBe(false);
  });

  test("an element with accepts takes only those children; without accepts, any non-part", () => {
    setSlotRules([
      { type: CARD, slots: [{ accepts: ["text"] }] },
      { type: TABS, slots: [{}] },
    ]);
    expect(canHoldChild(CARD, "text")).toBe(true);
    expect(canHoldChild(CARD, "heading")).toBe(false);
    expect(canHoldChild(TABS, "heading")).toBe(true);
  });
});

describe("the editor treats a slot holder as a parent", () => {
  const text = { id: "text0002", type: "text", props: { text: "New" } } as const;
  const heading = { id: "head0002", type: "heading", props: { text: "H", level: 2 } } as const;
  const holder = (): Layout => pageWithCard(CARD);
  const childIds = (layout: Layout, id: string) =>
    nodeChildren(findNode(layout, id) as never).map((child) => child.id);

  test("a child the slot accepts is added inside the holder", () => {
    rememberExtensions([cards()]);
    const added = addNode(holder(), text as never, { parentId: "card0001", index: 0 });
    if (!added.ok) throw new Error(added.reason);
    expect(childIds(added.layout, "card0001")[0]).toBe("text0002");
  });

  test("a child the slot does not accept is refused", () => {
    rememberExtensions([cards()]);
    expect(canDrop(holder(), { kind: "new", node: heading as never }, "card0001")).toEqual({
      ok: false,
      reason: REASONS.slotRefused,
    });
  });

  test("a child moves out of the holder and can be removed from it", () => {
    rememberExtensions([cards()]);
    const moved = moveNode(holder(), "text0001", "root0001", 0);
    if (!moved.ok) throw new Error(moved.reason);
    expect(childIds(moved.layout, "card0001")).not.toContain("text0001");
    expect(childIds(moved.layout, "root0001")).toContain("text0001");
    const removed = removeNode(holder(), "text0001");
    expect(removed.removed?.parentId).toBe("card0001");
  });

  test("a part goes into its own element, and nowhere else", () => {
    rememberExtensions([cards()]);
    const panel = { id: "pane0001", type: PANEL, props: {} };
    const layout = holder();
    const tabs = { id: "tabs0001", type: TABS, props: {}, children: [] };
    layout.root.children.push(tabs as never);
    expect(canDrop(layout, { kind: "new", node: panel as never }, "tabs0001")).toEqual({
      ok: true,
    });
    expect(canDrop(layout, { kind: "new", node: panel as never }, "root0001")).toEqual({
      ok: false,
      reason: REASONS.slotRefused,
    });
  });
});

describe("slot content keeps the page's ids and links (scope first, fill after)", () => {
  const html = (layout: Layout) => renderPage(layout, emptyDesign(), { mode: "public" }).html;
  const root = (children: unknown[]): Layout =>
    ({
      schemaVersion: LAYOUT_SCHEMA_VERSION,
      root: { id: "root0001", type: "container", props: {}, children },
    }) as Layout;
  const framed = (children: unknown[]) => ({
    id: "fram0001",
    type: `ext:${PKG}/framed`,
    props: {},
    children,
  });

  test("a page link to an id on the author's slot content still points at it", () => {
    rememberExtensions([cards()]);
    const out = html(
      root([
        { id: "go000001", type: "button", props: { text: "Go", href: "#pricing" } },
        framed([
          {
            id: "head0001",
            type: "heading",
            htmlId: "pricing",
            props: { text: "Pricing", level: 2 },
          },
        ]),
      ]),
    );
    expect(out).toContain('href="#pricing"');
    expect(out).toContain('id="pricing"');
    expect(out).not.toContain("ext-pricing");
  });

  test("a link in the author's slot content to an anchor elsewhere on the page is kept", () => {
    rememberExtensions([cards()]);
    const out = html(
      root([
        framed([{ id: "top00001", type: "button", props: { text: "Top", href: "#top-anchor" } }]),
        { id: "head0002", type: "heading", htmlId: "top-anchor", props: { text: "Top", level: 2 } },
      ]),
    );
    expect(out).toContain('href="#top-anchor"');
    expect(out).toContain('id="top-anchor"');
  });

  test("the extension's own ids and links are still scoped", () => {
    rememberExtensions([cards()]);
    const out = html(root([framed([])]));
    expect(out).toContain('id="ext-title"');
    expect(out).toContain('href="#ext-title"');
  });
});

describe("a slot has no wrapper element", () => {
  test("the author's content is a direct child of the element the slot sits in", () => {
    rememberExtensions([cards()]);
    const layout = {
      schemaVersion: LAYOUT_SCHEMA_VERSION,
      root: {
        id: "root0001",
        type: "container",
        props: {},
        children: [
          {
            id: "boxx0001",
            type: `ext:${PKG}/body-box`,
            props: {},
            children: [
              { id: "head0001", type: "heading", props: { text: "In the box", level: 2 } },
            ],
          },
        ],
      },
    } as Layout;
    const page = renderPage(layout, emptyDesign(), { mode: "public" });
    expect(page.html).toMatch(/<div data-box="">\s*<h2 /);
  });
});
