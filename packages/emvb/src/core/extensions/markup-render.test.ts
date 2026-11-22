import { beforeEach, describe, expect, test } from "bun:test";
import { emptyDesign } from "../schema/design.ts";
import { LAYOUT_SCHEMA_VERSION, type Layout } from "../schema/layout.ts";
import { renderPage } from "../render/index.ts";
import { defineExtension } from "./define.ts";
import { clearExtensions, rememberExtensions } from "./registry.ts";
import { EXTENSION_PLACEHOLDER_TEXT } from "./placeholder.ts";
import { extensionOutputKey } from "./render-ext.ts";

const TYPE = "ext:emvb-ext-card/box";

/** One extension with one element whose render() returns `output`. */
function register(output: () => unknown, classes?: { prefix: string; allow: string[] }) {
  rememberExtensions([
    defineExtension({
      id: "emvb-ext-card",
      ...(classes ? { classes } : {}),
      elements: [
        {
          name: "box",
          label: "Box",
          schema: { type: "object", properties: {} },
          fields: [],
          render: output as never,
        },
      ],
    }),
  ]);
}

/** The single extension element of a layout built by `page`. */
function elementOf(layout: Layout) {
  const element = layout.root.children?.[0];
  if (!element) throw new Error("the test layout has no element");
  return element;
}

const page = (type: string = TYPE): Layout => ({
  schemaVersion: LAYOUT_SCHEMA_VERSION,
  root: {
    id: "root0001",
    type: "container",
    props: {},
    children: [{ id: "ext00001", type, props: {} }],
  },
});

const publicHtml = (layout: Layout = page()) =>
  renderPage(layout, emptyDesign(), { mode: "public" }).html;

beforeEach(() => clearExtensions());

describe("markup output (extensionApi 1.x)", () => {
  test("a markup tree renders inside the extension wrapper", () => {
    register(() => ({
      markup: { tag: "p", attrs: {}, children: ["Hello from markup"] },
    }));
    const html = publicHtml();
    expect(html).toContain('data-emvb-ext="ext:emvb-ext-card/box"');
    expect(html).toContain("<p>Hello from markup</p>");
    expect(html).not.toContain(EXTENSION_PLACEHOLDER_TEXT);
  });

  test("only classes on the package allowlist survive", () => {
    register(
      () => ({
        markup: {
          tag: "div",
          attrs: { class: "daisy-btn btn-ghost" },
          children: ["x"],
        },
      }),
      { prefix: "daisy-", allow: ["daisy-btn"] },
    );
    const html = publicHtml();
    expect(html).toContain('class="daisy-btn"');
    expect(html).not.toContain("btn-ghost");
  });

  test("an unsafe href is dropped and the link text is kept", () => {
    register(() => ({
      markup: {
        tag: "a",
        attrs: { href: "javascript:alert(1)" },
        children: ["Click"],
      },
    }));
    const html = publicHtml();
    expect(html).toContain("Click");
    expect(html).not.toContain("javascript:");
  });

  test("event handler attributes are dropped", () => {
    register(() => ({
      markup: {
        tag: "p",
        attrs: { onclick: "alert(1)" },
        children: ["Safe text"],
      },
    }));
    const html = publicHtml();
    expect(html).toContain("Safe text");
    expect(html).not.toContain("onclick");
  });

  test("a tag outside the serializer allowlist shows the placeholder", () => {
    register(() => ({
      markup: { tag: "script", attrs: {}, children: ["alert(1)"] },
    }));
    const html = publicHtml();
    expect(html).toContain(EXTENSION_PLACEHOLDER_TEXT);
    expect(html).not.toContain("<script");
  });

  test("malformed children show the placeholder, never throw", () => {
    register(() => ({ markup: { tag: "div", attrs: {}, children: 5 } }));
    expect(publicHtml()).toContain(EXTENSION_PLACEHOLDER_TEXT);
  });

  test("a throwing getter inside markup shows the placeholder and leaves siblings", () => {
    register(() => ({
      markup: {
        tag: "div",
        attrs: {},
        get children(): never {
          throw new Error("boom");
        },
      },
    }));
    const layout: Layout = {
      schemaVersion: LAYOUT_SCHEMA_VERSION,
      root: {
        id: "root0001",
        type: "container",
        props: {},
        children: [
          { id: "head0001", type: "heading", props: { text: "Sibling", level: 2 } },
          { id: "ext00001", type: TYPE, props: {} },
        ],
      },
    };
    const html = publicHtml(layout);
    expect(html).toContain("Sibling");
    expect(html).toContain(EXTENSION_PLACEHOLDER_TEXT);
  });

  test("dialog and table markup, the native elements daisyUI needs, render", () => {
    register(() => ({
      markup: {
        tag: "dialog",
        attrs: { open: "" },
        children: [
          {
            tag: "table",
            attrs: {},
            children: [
              {
                tag: "tr",
                attrs: {},
                children: [{ tag: "th", attrs: { scope: "col" }, children: ["Name"] }],
              },
            ],
          },
        ],
      },
    }));
    const html = publicHtml();
    expect(html).toContain("<dialog");
    expect(html).toContain('<th scope="col">Name</th>');
    expect(html).not.toContain(EXTENSION_PLACEHOLDER_TEXT);
  });

  test("a popovertarget value that could carry markup is dropped, the element stays", () => {
    register(() => ({
      markup: {
        tag: "button",
        attrs: { popovertarget: '"><img src=x onerror=alert(1)>' },
        children: ["Open"],
      },
    }));
    const html = publicHtml();
    expect(html).toContain("Open");
    expect(html).not.toContain("popovertarget");
    expect(html).not.toContain("onerror");
  });

  describe("render mode (ctx.mode)", () => {
    test("an element reads the mode it is drawn in", () => {
      rememberExtensions([
        defineExtension({
          id: "emvb-ext-card",
          elements: [
            {
              name: "box",
              label: "Box",
              schema: { type: "object", properties: {} },
              fields: [],
              render: (_props, ctx) => ({
                markup: {
                  tag: "p",
                  attrs: {},
                  children: [ctx.mode === "editor" ? "Editing" : "Public"],
                },
              }),
            },
          ],
        }),
      ]);
      expect(publicHtml()).toContain("Public");
      expect(publicHtml()).not.toContain("Editing");
      const editor = renderPage(page(), emptyDesign(), { mode: "editor" }).html;
      expect(editor).toContain("Editing");
    });
  });

  describe("ids", () => {
    const twoInstances = (): Layout => ({
      schemaVersion: LAYOUT_SCHEMA_VERSION,
      root: {
        id: "root0001",
        type: "container",
        props: {},
        children: [
          { id: "ext00001", type: TYPE, props: {} },
          { id: "ext00002", type: TYPE, props: {} },
        ],
      },
    });
    const withMarkup = (markup: unknown) => {
      register(() => ({ markup: markup as never }));
      return twoInstances();
    };

    test("two instances of one element never share an id", () => {
      const html = publicHtml(
        withMarkup({
          tag: "div",
          attrs: { id: "item" },
          children: [{ tag: "p", attrs: { id: "note" }, children: ["x"] }],
        }),
      );
      expect(html).toContain('id="ext-ext00001-item"');
      expect(html).toContain('id="ext-ext00002-item"');
      expect(html).toContain('id="ext-ext00001-note"');
      expect(html).toContain('id="ext-ext00002-note"');
    });

    test("references to a scoped id follow the same scope", () => {
      const html = publicHtml(
        withMarkup({
          tag: "div",
          attrs: {},
          children: [
            { tag: "h2", attrs: { id: "title" }, children: ["Title"] },
            { tag: "section", attrs: { "aria-labelledby": "title" }, children: ["body"] },
            { tag: "a", attrs: { href: "#title" }, children: ["jump"] },
          ],
        }),
      );
      expect(html).toContain('aria-labelledby="ext-ext00001-title"');
      expect(html).toContain('href="#ext-ext00001-title"');
    });

    test("an id that clobbers a browser global or claims EmVB's names is dropped", () => {
      const html = publicHtml(
        withMarkup({
          tag: "div",
          attrs: {},
          children: [
            { tag: "p", attrs: { id: "location" }, children: ["a"] },
            { tag: "p", attrs: { id: "emvb-root" }, children: ["b"] },
          ],
        }),
      );
      expect(html).not.toContain('id="ext-ext00001-location"');
      expect(html).not.toContain('id="ext-ext00001-emvb-root"');
      expect(html).not.toContain('id="emvb-root"');
      expect(html).toContain("a");
      expect(html).toContain("b");
    });

    test("a fragment that is not a plain id is dropped, the link stays", () => {
      const html = publicHtml(
        withMarkup({
          tag: "a",
          attrs: { href: "#bad fragment" },
          children: ["link"],
        }),
      );
      expect(html).toContain("link");
      expect(html).not.toContain("bad fragment");
    });
  });

  test("the editor fallback re-checks stored markup and refuses an unsafe tag", () => {
    // The package is not registered here (the admin has no render code); the server's output is.
    const layout = page();
    const key = extensionOutputKey(elementOf(layout));
    const outputs = new Map<string, unknown>([
      [key, { markup: { tag: "iframe-x", attrs: {}, children: [] } }],
    ]);
    const html = renderPage(layout, emptyDesign(), {
      mode: "editor",
      extensionOutputs: outputs,
    }).html;
    // The editor shows its own placeholder (emvb-ext-missing), not the public text.
    expect(html).toContain("emvb-ext-missing");
    expect(html).not.toContain("iframe-x");
  });

  test("the editor fallback draws stored markup that passes the check", () => {
    const layout = page();
    const key = extensionOutputKey(elementOf(layout));
    const outputs = new Map<string, unknown>([
      [key, { markup: { tag: "p", attrs: {}, children: ["From the server"] } }],
    ]);
    const html = renderPage(layout, emptyDesign(), {
      mode: "editor",
      extensionOutputs: outputs,
    }).html;
    expect(html).toContain("From the server");
    expect(html).not.toContain(EXTENSION_PLACEHOLDER_TEXT);
  });
});
