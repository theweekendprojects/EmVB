import { beforeEach, describe, expect, test } from "bun:test";
import { defineExtension } from "../../../core/extensions/define.ts";
import { clearExtensions, rememberExtensions } from "../../../core/extensions/registry.ts";
import { newElement } from "./new-element.ts";

const box = defineExtension({
  id: "emvb-ext-box",
  label: "Box",
  elements: [
    {
      name: "card",
      label: "Card",
      container: true,
      schema: { type: "object", properties: {} },
      fields: [],
      render: () => ({ id: "x0000001", type: "heading", props: { text: "Card", level: 3 } }),
    },
    {
      name: "tag",
      label: "Tag",
      schema: { type: "object", properties: {} },
      fields: [],
      render: () => ({ id: "x0000002", type: "heading", props: { text: "Tag", level: 3 } }),
    },
  ],
});

beforeEach(() => {
  clearExtensions();
  rememberExtensions([box]);
});

describe("extension elements from the Add panel (W-927, container)", () => {
  test("a container starts with an empty children array so it can take drops", () => {
    expect(newElement("ext:emvb-ext-box/card")).toMatchObject({
      type: "ext:emvb-ext-box/card",
      children: [],
    });
  });

  test("a leaf starts without a children array", () => {
    const node = newElement("ext:emvb-ext-box/tag");
    expect(node).not.toBeNull();
    expect(node && "children" in node).toBe(false);
  });
});
