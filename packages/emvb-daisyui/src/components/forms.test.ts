import { describe, expect, test } from "bun:test";
import { FORM_DAISY_COMPONENTS } from "../catalog/forms.ts";
import { daisyUIProvider } from "../provider.ts";
import type { DaisyComponentNode, VNode } from "../types.ts";

const node = (component: string, props: Record<string, string | number | boolean>): DaisyComponentNode => ({ id: `test-${component}`, type: "daisy", component, props });
const render = (component: string, props: Record<string, string | number | boolean>): VNode => daisyUIProvider.render(node(component, props));

function walk(vnode: VNode): VNode[] {
  return [vnode, ...vnode.children.flatMap(child => typeof child === "string" ? [] : walk(child))];
}

describe("WP5 generated form components", () => {
  test("catalog includes all nine form controls", () => {
    expect(FORM_DAISY_COMPONENTS.map(item => item.id)).toEqual(["input", "textarea", "select", "checkbox", "radio", "toggle", "file-input", "range", "rating"]);
  });

  test("every control has an accessible name in its rendered output", () => {
    const cases: Array<[string, Record<string, string | number | boolean>]> = [
      ["input", { type:"email", placeholder:"Email", value:"", name:"email", label:"Email address", disabled:false, required:true, size:"md", tone:"primary", variant:"default" }],
      ["textarea", { placeholder:"Message", value:"", rows:4, name:"message", label:"Message", disabled:false, required:true, size:"md", tone:"neutral", variant:"default" }],
      ["select", { options:"A\nB", selected:"B", name:"choice", label:"Choose one", disabled:false, required:true, size:"md", tone:"neutral", variant:"default" }],
      ["checkbox", { name:"terms", value:"yes", label:"Accept terms", checked:true, disabled:false, size:"md", tone:"primary" }],
      ["radio", { name:"plan", value:"pro", label:"Pro plan", checked:true, disabled:false, size:"md", tone:"primary" }],
      ["toggle", { name:"alerts", value:"on", label:"Enable alerts", checked:true, disabled:false, size:"md", tone:"primary" }],
      ["file-input", { name:"asset", label:"Upload asset", accept:"image/*", multiple:false, disabled:false, size:"md", tone:"neutral" }],
      ["range", { name:"volume", label:"Volume", min:0, max:100, step:1, value:40, size:"md", tone:"primary" }],
      ["rating", { name:"rating", label:"Product rating", max:5, value:4, size:"md" }],
    ];
    for (const [component, props] of cases) {
      const rendered = render(component, props);
      expect(walk(rendered).some(item => item.attrs["aria-label"])).toBe(true);
    }
  });

  test("layout JSON round-trip preserves semantic form props and never stores raw classes", () => {
    const original = node("input", { type:"email", placeholder:"you@example.com", value:"", name:"email", label:"Email", disabled:false, required:true, size:"lg", tone:"success", variant:"ghost" });
    const restored = JSON.parse(JSON.stringify(original)) as DaisyComponentNode;
    expect(restored).toEqual(original);
    expect(JSON.stringify(restored)).not.toContain("input-success");
    expect(daisyUIProvider.render(restored).attrs.class).toBe("input input-lg input-success input-ghost");
  });

  test("select escapes structure by producing VNodes rather than HTML strings", () => {
    const rendered = render("select", { options:"Safe\n<script>alert(1)</script>", selected:"Safe", name:"choice", label:"Choice", disabled:false, required:false, size:"md", tone:"neutral", variant:"default" });
    expect(rendered.children[1]).toEqual({ tag:"option", attrs:{ value:"<script>alert(1)</script>" }, children:["<script>alert(1)</script>"] });
  });

  test("range clamps an invalid persisted value", () => {
    expect(render("range", { name:"volume", label:"Volume", min:10, max:20, step:1, value:99, size:"md", tone:"primary" }).attrs.value).toBe("20");
  });

  test("rating clamps maximum and creates one checked radio", () => {
    const rendered = render("rating", { name:"score", label:"Score", max:99, value:99, size:"md" });
    const radios = rendered.children.filter((child): child is VNode => typeof child !== "string");
    expect(radios).toHaveLength(10);
    expect(radios.filter(item => item.attrs.checked === "checked")).toHaveLength(1);
    expect(rendered.attrs.role).toBe("radiogroup");
  });

  test("arbitrary class injection is ignored across form controls", () => {
    const rendered = render("input", { type:"text", placeholder:"x", value:"", name:"x", label:"X", disabled:false, required:false, size:"fixed top-0", tone:"[color:red]", variant:"default" });
    expect(rendered.attrs.class).toBe("input");
  });
});
