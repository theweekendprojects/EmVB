import { describe, expect, test } from "bun:test";
import { serialize } from "../../../emvb/src/core/render/vnode.ts";
import { daisyUIProvider } from "../provider.ts";

// Regression checks for defects seen in the real editor canvas. Each one asserts the class that
// removes the defect, so dropping the class fails the test.
const render = (component: string, props: Record<string, unknown> = {}) => {
  const node = daisyUIProvider.createNode(component, "vf000001");
  Object.assign(node.props, props);
  return serialize(daisyUIProvider.render(node) as never);
};

describe("editor canvas fixes", () => {
  test("indicator: the root keeps its centring class and the badge keeps its position", () => {
    const html = render("indicator");
    expect(html).toMatch(/<div class="indicator w-fit mx-auto"/);
    expect(html).toMatch(/<span class="indicator-item badge indicator-top indicator-end/);
  });

  test("dock: sits in flow, not pinned over the page", () => {
    expect(render("dock")).toMatch(/<nav class="dock [^"]*relative"/);
  });

  test("diff: each label is pinned to its own side so the two cannot stack", () => {
    const html = render("diff");
    expect(html).toContain('class="diff-item-1 text-start p-4"');
    expect(html).toContain('class="diff-item-2 text-end p-4"');
  });

  test("aura: the root has a width, so the glow is not a 4px streak", () => {
    expect(render("aura")).toMatch(/<div class="aura [^"]*w-full max-w-md"/);
  });

  test("skeleton: the default fill is tinted, not the page colour", () => {
    expect(render("skeleton")).toContain("bg-base-content/15");
  });
});
