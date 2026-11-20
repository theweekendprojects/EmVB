import { beforeEach, describe, expect, test } from "bun:test";
import { emptyDesign } from "../schema/design.ts";
import { LAYOUT_SCHEMA_VERSION, type Layout } from "../schema/layout.ts";
import { renderPage } from "../render/index.ts";
import { defineExtension } from "./define.ts";
import { EXTENSION_PLACEHOLDER_TEXT } from "./placeholder.ts";
import { clearExtensions, liveExtension, rememberExtensions } from "./registry.ts";
import { extensionAssetEntries } from "./extension-assets.ts";
import { safeMarkup, classAllowlist } from "./markup.ts";

// A fixture package whose markup elements cover each rule: classes, URLs, styles, tags and events.
const kit = () =>
  defineExtension({
    id: "emvb-ext-kit",
    label: "Kit",
    classes: ["btn", "btn-primary"],
    styles: ["@perkyzz/emvb-ext-kit/kit.css"],
    runtime: ["@perkyzz/emvb-ext-kit/runtime"],
    elements: [
      {
        name: "action",
        label: "Action",
        schema: { type: "object", properties: {} },
        fields: [],
        render: () => ({
          markup: {
            tag: "a",
            attrs: {
              class: "btn btn-primary btn-ghost",
              href: "javascript:alert(1)",
              onclick: "steal()",
              style: "color: red; --value: 70; background: url(https://evil.test/x.png)",
            },
            children: ["Go"],
          },
        }),
      },
      {
        name: "bad-tag",
        label: "Bad tag",
        schema: { type: "object", properties: {} },
        fields: [],
        render: () => ({ markup: { tag: "script", attrs: {}, children: ["alert(1)"] } }),
      },
      {
        name: "picture",
        label: "Picture",
        schema: { type: "object", properties: {} },
        fields: [],
        render: () => ({
          markup: {
            tag: "img",
            attrs: { src: "javascript:alert(1)", alt: "Photo" },
            children: [],
          },
        }),
      },
      {
        name: "safe-link",
        label: "Safe link",
        schema: { type: "object", properties: {} },
        fields: [],
        render: () => ({
          markup: { tag: "a", attrs: { href: "https://example.com/x" }, children: ["Ok"] },
        }),
      },
    ],
  });

const pageWith = (type: string): Layout => ({
  schemaVersion: LAYOUT_SCHEMA_VERSION,
  root: {
    id: "root0001",
    type: "container",
    props: {},
    children: [{ id: "ext00001", type, props: {} }],
  },
});

const render = (type: string) => renderPage(pageWith(type), emptyDesign(), { mode: "public" }).html;

beforeEach(() => {
  clearExtensions();
  rememberExtensions([kit()]);
});

describe("markup output (extensionApi 1.x)", () => {
  test("markup keeps only the classes the package declared", () => {
    const html = render("ext:emvb-ext-kit/action");
    expect(html).toContain(">Go</a>");
    expect(html).toContain('class="btn btn-primary"');
    expect(html).not.toContain("btn-ghost");
  });

  test("markup drops javascript: URLs and event handlers", () => {
    const html = render("ext:emvb-ext-kit/action");
    expect(html).toContain(">Go</a>");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("steal()");
  });

  test("markup drops inline style, which the serializer does not allow", () => {
    const html = render("ext:emvb-ext-kit/action");
    expect(html).toContain(">Go</a>");
    expect(html).not.toContain("style=");
    expect(html).not.toContain("--value");
    expect(html).not.toContain("url(");
  });

  test("markup with a tag outside the serializer allowlist shows the placeholder", () => {
    const html = render("ext:emvb-ext-kit/bad-tag");
    expect(html).toContain(EXTENSION_PLACEHOLDER_TEXT);
    expect(html).not.toContain("<script");
  });

  test("markup keeps a safe https link", () => {
    expect(render("ext:emvb-ext-kit/safe-link")).toContain('href="https://example.com/x"');
  });

  test("the element keeps its extension wrapper around markup", () => {
    const html = render("ext:emvb-ext-kit/safe-link");
    expect(html).toContain('data-emvb-ext="ext:emvb-ext-kit/safe-link"');
    expect(html).toContain("emvb-ext");
  });
});

describe("markup checks that do not depend on the serializer", () => {
  test("safeMarkup refuses a tag outside the allowlist", () => {
    const out = safeMarkup(
      { tag: "script", attrs: {}, children: ["alert(1)"] },
      classAllowlist([]),
    );
    expect(out).toBeUndefined();
  });

  test("an image source with a javascript: URL is dropped and the image still renders", () => {
    const html = render("ext:emvb-ext-kit/picture");
    expect(html).toContain('alt="Photo"');
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("src=");
  });
});

describe("registration of additive fields (extensionApi 1.x)", () => {
  test("classes are kept only as valid class tokens", () => {
    clearExtensions();
    rememberExtensions([
      defineExtension({
        id: "emvb-ext-tokens",
        classes: ["btn", "BAD class", "x".repeat(70), "card-body"],
      }),
    ]);
    expect(liveExtension("emvb-ext-tokens")?.classes).toEqual(["btn", "card-body"]);
  });

  test("stylesheet and runtime specifiers keep only well-formed entries", () => {
    clearExtensions();
    rememberExtensions([
      defineExtension({
        id: "emvb-ext-paths",
        styles: [
          "@perkyzz/emvb-ext-paths/a.css",
          "../escape.css",
          "bad path.css",
          "@perkyzz/emvb-ext-paths/a.css",
        ],
        runtime: ["/assets/run.js"],
      }),
    ]);
    expect(liveExtension("emvb-ext-paths")?.styles).toEqual(["@perkyzz/emvb-ext-paths/a.css"]);
    expect(liveExtension("emvb-ext-paths")?.runtime).toEqual(["/assets/run.js"]);
  });
});

describe("extension assets per page (extensionApi 1.x)", () => {
  test("two packages sharing a stylesheet list it once", () => {
    rememberExtensions([
      defineExtension({
        id: "emvb-ext-other",
        styles: ["@perkyzz/emvb-ext-kit/kit.css"],
        elements: [
          {
            name: "note",
            label: "Note",
            schema: { type: "object", properties: {} },
            fields: [],
            render: () => ({ markup: { tag: "p", attrs: {}, children: ["Note"] } }),
          },
        ],
      }),
    ]);
    const layout: Layout = {
      schemaVersion: LAYOUT_SCHEMA_VERSION,
      root: {
        id: "root0001",
        type: "container",
        props: {},
        children: [
          { id: "ext00001", type: "ext:emvb-ext-kit/safe-link", props: {} },
          { id: "ext00002", type: "ext:emvb-ext-other/note", props: {} },
        ],
      },
    };
    expect(extensionAssetEntries(layout.root).styles).toEqual(["@perkyzz/emvb-ext-kit/kit.css"]);
  });

  test("two elements of one package list its stylesheet once", () => {
    const layout: Layout = {
      schemaVersion: LAYOUT_SCHEMA_VERSION,
      root: {
        id: "root0001",
        type: "container",
        props: {},
        children: [
          { id: "ext00001", type: "ext:emvb-ext-kit/safe-link", props: {} },
          { id: "ext00002", type: "ext:emvb-ext-kit/action", props: {} },
        ],
      },
    };
    expect(extensionAssetEntries(layout.root).styles).toEqual(["@perkyzz/emvb-ext-kit/kit.css"]);
  });

  test("a page lists only the packages whose elements it renders", () => {
    const used = extensionAssetEntries(pageWith("ext:emvb-ext-kit/safe-link").root);
    expect(used.styles).toEqual(["@perkyzz/emvb-ext-kit/kit.css"]);
    expect(used.runtimes).toEqual(["@perkyzz/emvb-ext-kit/runtime"]);
    const unused = extensionAssetEntries({
      id: "root0001",
      type: "container",
      props: {},
      children: [],
    } as never);
    expect(unused).toEqual({ styles: [], runtimes: [] });
  });
});
