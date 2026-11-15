import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { addNode } from "../arrange.ts";
import { isParentNode, LAYOUT_SCHEMA_VERSION, type Layout, type LayoutNode } from "../schema/layout.ts";
import { emptyDesign } from "../schema/design.ts";
import { renderPage } from "./index.ts";
import { registerComponentProvider } from "@perkyzz/emvb-provider-api";

// A provider with one container component and one leaf, so the tests do not depend on daisyUI.
// Children of a container are rendered inside it and reachable in the editor; a leaf takes none.
const stub = {
  id: "stubkit",
  label: "Stub kit",
  nodeType: "provider",
  components: new Map([
    [
      "panel",
      {
        descriptor: {
          type: "provider",
          provider: "stubkit",
          component: "panel",
          name: "Panel",
          group: "content",
          defaultTab: "content",
          fields: [],
          container: true,
        },
        defaults: () => ({ type: "provider", provider: "stubkit", component: "panel", props: {}, children: [] }),
        build: (_node: unknown, attrs: Record<string, string> = {}, children: unknown[] = []) => ({
          tag: "section",
          attrs: { ...attrs, class: "stub-panel" },
          children,
        }),
      },
    ],
    [
      "chip",
      {
        descriptor: {
          type: "provider",
          provider: "stubkit",
          component: "chip",
          name: "Chip",
          group: "content",
          defaultTab: "content",
          fields: [{ key: "label", kind: "text", label: "Label" }],
        },
        defaults: () => ({ type: "provider", provider: "stubkit", component: "chip", props: { label: "Chip" } }),
        build: (node: { props: { label: string } }, attrs: Record<string, string> = {}) => ({
          tag: "span",
          attrs: { ...attrs, class: "stub-chip" },
          children: [node.props.label],
        }),
      },
    ],
  ]),
  cssEntryPoints: [],
  createNode(component: string, id: string) {
    return { id, ...this.components.get(component)!.defaults() } as never;
  },
  render(node: { component: string; props: Record<string, unknown> }, attrs?: Record<string, string>, children?: unknown[]) {
    const component = this.components.get(node.component) as unknown as {
      build: (node: unknown, attrs?: Record<string, string>, children?: unknown[]) => unknown;
    };
    return component.build(node, attrs, children) as never;
  },
};

const panel = (children: LayoutNode[]) =>
  ({ id: "panel001", type: "provider", provider: "stubkit", component: "panel", props: {}, children }) as unknown as LayoutNode;
const chip = (label: string) =>
  ({ id: "chip0001", type: "provider", provider: "stubkit", component: "chip", props: { label } }) as unknown as LayoutNode;
const page = (children: LayoutNode[]): Layout =>
  ({ schemaVersion: LAYOUT_SCHEMA_VERSION, root: { id: "root0001", type: "container", props: {}, children } }) as Layout;

let dispose: () => void;
beforeAll(() => {
  dispose = registerComponentProvider(stub as never);
});
afterAll(() => dispose());

describe("provider containers hold children (step 1)", () => {
  test("a container component is a parent, a leaf component is not", () => {
    expect(isParentNode(panel([]))).toBe(true);
    expect(isParentNode(chip("x"))).toBe(false);
  });

  test("a child placed inside a provider container renders inside it on the public page", () => {
    const html = renderPage(page([panel([chip("Inside")])]), emptyDesign(), { mode: "public" }).html;
    expect(html).toMatch(/<section[^>]*stub-panel[^>]*><span[^>]*stub-chip[^>]*>Inside<\/span><\/section>/);
  });

  test("the editor can add a child into a provider container", () => {
    const layout = page([panel([])]);
    const result = addNode(layout, chip("New"), { parentId: "panel001", index: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const placed = (result.layout.root.children?.[0] as { children?: LayoutNode[] }).children ?? [];
    expect(placed.map((node) => node.id)).toContain("chip0001");
  });
});
