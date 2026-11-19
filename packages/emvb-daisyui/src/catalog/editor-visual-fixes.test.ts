import { describe, expect, test } from "bun:test";
import { serialize } from "../../../emvb/src/core/render/vnode.ts";
import { nodeForRender } from "../runtime/index.ts";
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
    expect(html).toMatch(/<div class="indicator w-fit mx-auto my-4"/);
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
    expect(render("aura")).toMatch(/<div class="aura [^"]*w-full max-w-md opacity-60"/);
  });

  test("skeleton: the default fill is tinted, not the page colour", () => {
    expect(render("skeleton")).toContain("bg-base-content/15");
  });

  test("avatar: initials are centred in the placeholder disc", () => {
    expect(render("avatar", { src: "", alt: "Ada Lovelace" })).toContain(
      'class="grid place-items-center bg-primary',
    );
  });

  test("radial progress: sized so its value label fits inside the ring", () => {
    expect(render("radial-progress")).toMatch(/class="radial-progress [^"]*size-24!"/);
  });

  test("modal: open in the editor canvas, closed on the public page", () => {
    const node = daisyUIProvider.createNode("modal", "vf000003");
    expect(nodeForRender(node, { mode: "editor" }).props.open).toBe(true);
    expect(nodeForRender(node, { mode: "public" }).props.open).not.toBe(true);
  });

  test("container: presets stack on phones and split from medium with the chosen ratio", () => {
    const node = daisyUIProvider.createNode("container", "vf000004");
    expect(render("container")).toMatch(/<div class="container mx-auto my-4"/);
    node.props.layout = "split";
    node.props.ratio = "1:2";
    const split = serialize(daisyUIProvider.render(node) as never);
    expect(split).toContain("grid grid-cols-1 gap-6 items-center");
    expect(split).toContain("md:grid-cols-[1fr_2fr]");
    node.props.layout = "sidebar";
    node.props.ratio = "1:1";
    expect(serialize(daisyUIProvider.render(node) as never)).toContain("md:grid-cols-[16rem_1fr]");
    node.props.layout = "cards";
    expect(serialize(daisyUIProvider.render(node) as never)).toContain("md:grid-cols-3");
  });

  test("steps: a line can set its own colour, the others keep the shared tone", () => {
    const node = daisyUIProvider.createNode("steps", "vf000002");
    node.props.items = "Plan|info\nPay\nShip";
    node.props.current = 2;
    const html = serialize(daisyUIProvider.render(node) as never);
    expect(html).toContain('<li class="step step-info"');
    expect(html).toContain('<li class="step step-primary" aria-current="step"');
    expect(html).toContain('<li class="step">Ship</li>');
  });

  test("checkbox: the control has visible text beside it", () => {
    const html = render("checkbox", { label: "Accept terms" });
    expect(html).toMatch(/^<label class="[^"]*flex items-center gap-2/);
    expect(html).toContain("<span>Accept terms</span>");
  });
});
