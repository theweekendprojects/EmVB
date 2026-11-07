import { describe, expect, test } from "bun:test";
import { INTERACTIVE_DAISY_COMPONENTS } from "../catalog/interactive.ts";
import { daisyUIProvider } from "../provider.ts";
import type { VNode } from "../types.ts";

const render = (component: string, props: Record<string, string | number | boolean>, children: VNode[] = []) =>
  daisyUIProvider.render({ id: `interactive-${component}`, type: "daisy", component, props }, {}, children);
const walk = (node: VNode): VNode[] => [node, ...node.children.flatMap(child => typeof child === "string" ? [] : walk(child))];

describe("WP7 generated interactive components", () => {
  test("catalog adds eight interactive components", () => {
    expect(INTERACTIVE_DAISY_COMPONENTS.map(item => item.id)).toEqual(["tabs", "accordion", "dropdown", "modal", "drawer", "carousel", "collapse", "swap"]);
  });

  test("tabs expose one selected radio and bounded tab count", () => {
    const rendered = render("tabs", { label:"Product tabs", items:Array.from({length:30},(_,i)=>`Tab ${i+1}|Content`).join("\n"), active:99, style:"box" });
    const radios = walk(rendered).filter(item => item.attrs.type === "radio");
    expect(radios).toHaveLength(12);
    expect(radios.filter(item => item.attrs.checked === "checked")).toHaveLength(1);
    expect(rendered.attrs.role).toBe("tablist");
  });

  test("modal uses native dialog semantics and labelled title", () => {
    const rendered = render("modal", { title:"Delete item", body:"This cannot be undone", open:true, closeLabel:"Cancel", position:"middle" });
    expect(rendered.tag).toBe("dialog");
    expect(rendered.attrs["aria-labelledby"]).toBe("interactive-modal-title");
    expect(walk(rendered).some(item => item.attrs.id === "interactive-modal-title")).toBe(true);
    expect(walk(rendered).some(item => item.attrs.method === "dialog")).toBe(true);
  });

  test("dropdown URL sanitization blocks executable links", () => {
    const rendered = render("dropdown", { label:"Menu", items:"Bad|javascript:alert(1)\nGood|/safe", open:false, align:"start" });
    const hrefs = walk(rendered).map(item => item.attrs.href).filter(Boolean);
    expect(hrefs).toEqual(["#", "/safe"]);
  });

  test("drawer connects labels to a unique checkbox control", () => {
    const rendered = render("drawer", { label:"Navigation", buttonLabel:"Open", side:"end", open:true });
    const control = walk(rendered).find(item => item.attrs.class === "drawer-toggle");
    const labels = walk(rendered).filter(item => item.attrs.for === control?.attrs.id);
    expect(control?.attrs.checked).toBe("checked");
    expect(labels.length).toBeGreaterThanOrEqual(2);
  });

  test("carousel caps output and hides all but the current slide", () => {
    const slides = Array.from({length:50},(_,i)=>`Slide ${i+1}|Description`).join("\n");
    const rendered = render("carousel", { label:"Features", slides, current:99, width:"full" });
    const items = walk(rendered).filter(item => item.attrs.class?.includes("carousel-item"));
    expect(items).toHaveLength(20);
    expect(items.filter(item => item.attrs["aria-hidden"] !== "true")).toHaveLength(1);
    expect(rendered.attrs["aria-roledescription"]).toBe("carousel");
  });

  test("details-based accordion and collapse need no client runtime", () => {
    const accordion = render("accordion", { label:"FAQ", items:"One|First\nTwo|Second", open:1, icon:"arrow" });
    const collapse = render("collapse", { title:"Details", content:"Content", open:true, icon:"plus" });
    expect(walk(accordion).filter(item => item.tag === "details")).toHaveLength(2);
    expect(collapse.tag).toBe("details");
    expect(collapse.attrs.open).toBe("open");
  });

  test("swap is keyboard-operable through native checkbox input", () => {
    const rendered = render("swap", { label:"Toggle theme", on:"Dark", off:"Light", active:true, effect:"rotate" });
    const input = walk(rendered).find(item => item.attrs.type === "checkbox");
    expect(rendered.attrs["aria-label"]).toBe("Toggle theme");
    expect(input?.attrs.checked).toBe("checked");
  });

  test("interactive layout JSON round-trips without generated classes", () => {
    const original = { id:"tabs-1", type:"daisy" as const, component:"tabs", props:{label:"Tabs",items:"A|One\nB|Two",active:2,style:"lift"} };
    const restored = JSON.parse(JSON.stringify(original));
    expect(restored).toEqual(original);
    expect(JSON.stringify(restored)).not.toContain("tabs-lift");
    expect(daisyUIProvider.render(restored).attrs.class).toBe("tabs tabs-lift");
  });

  test("invalid class options cannot inject utilities", () => {
    expect(render("dropdown", { label:"Menu", items:"Home|/", open:false, align:"fixed top-0" }).attrs.class).toBe("dropdown");
  });
});
