import { beforeEach, describe, expect, test } from "bun:test";
import { emptyDesign } from "../schema/design.ts";
import { LAYOUT_SCHEMA_VERSION, type Layout } from "../schema/layout.ts";
import { renderPage } from "../render/index.ts";
import { defineExtension } from "./define.ts";
import { clearExtensions, rememberExtensions } from "./registry.ts";
import type { ExtensionOutputNode } from "./types.ts";

// The 1.5 pull requests are independent, so no single one can test how they work together. These
// cases do: a markup node with a kit class and a CSS variable (markup + class names + extVars),
// and an element whose own ids are scoped while the editor's content in its slot is not
// (markup + ids + slots).
const PKG = "emvb-ext-batch";

const batch = () =>
  defineExtension({
    id: PKG,
    label: "Batch",
    classes: { prefix: "kit-", allow: ["kit-radial", "kit-card"] },
    elements: [
      {
        name: "gauge",
        label: "Gauge",
        schema: { type: "object", properties: {} },
        fields: [],
        defaults: () => ({}),
        render: (): ExtensionOutputNode[] => [
          {
            type: "markup",
            props: { tag: "div", text: "70%" },
            extClasses: ["kit-radial"],
            extVars: { "--kit-value": "70" },
          },
        ],
      },
      {
        name: "card",
        label: "Card",
        schema: { type: "object", properties: {} },
        fields: [],
        defaults: () => ({}),
        slots: [{ name: "body", label: "Body" }],
        render: (): ExtensionOutputNode[] => [
          { type: "markup", props: { tag: "h3", attrs: { id: "title" }, text: "Own heading" } },
          { type: "ext-slot", name: "body" },
        ],
      },
    ],
  });

const page = (children: unknown[]): Layout =>
  ({
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    root: { id: "root0001", type: "container", props: {}, children },
  }) as Layout;

beforeEach(() => {
  clearExtensions();
  rememberExtensions([batch()]);
});

describe("the 1.5 pull requests together", () => {
  test("a markup node carries its kit class and its CSS variable", () => {
    const out = renderPage(
      page([{ id: "gauge001", type: `ext:${PKG}/gauge`, props: {} }]),
      emptyDesign(),
      { mode: "public" },
    );
    expect(out.html).toMatch(/<div class="kit-radial emvb-e-[^"]+">70%<\/div>/);
    expect(out.css).toContain("--kit-value:70");
  });

  test("the extension's own ids are scoped, and the editor's content in its slot keeps its own", () => {
    const editorHeading = {
      id: "head0001",
      type: "heading",
      htmlId: "title",
      props: { text: "Editor heading", level: 2 },
    };
    const out = renderPage(
      page([{ id: "card0001", type: `ext:${PKG}/card`, props: {}, children: [editorHeading] }]),
      emptyDesign(),
      { mode: "public" },
    );
    // The editor's CSS id is still `title`, once; the extension's own `title` became `ext-title`.
    expect(out.html.match(/id="title"/g)?.length).toBe(1);
    expect(out.html).toContain('id="ext-title"');
    expect(out.html).toContain("Editor heading");
    expect(out.html).toContain("Own heading");
  });
});
