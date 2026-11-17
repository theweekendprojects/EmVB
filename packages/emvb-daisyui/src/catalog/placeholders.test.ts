import { describe, expect, test } from "bun:test";
import { createDaisyUIProvider } from "../render/provider.ts";
import { DAISY_COMPONENT_CATALOG } from "./index.ts";

// Defaults must not point at image files the site does not host. An empty picture shows a daisyUI
// placeholder instead, and a picture that is set still renders as before.
const provider = createDaisyUIProvider(DAISY_COMPONENT_CATALOG);
const render = (component: string, props: Record<string, string> = {}) => {
  const node = provider.createNode(component, "img00001");
  return JSON.stringify(provider.render({ ...node, props: { ...node.props, ...props } } as never));
};

describe("default images are placeholders, not missing files", () => {
  test("avatar with no picture shows initials on a placeholder, not a file request", () => {
    const out = render("avatar", { src: "", alt: "User avatar" });
    expect(out).not.toContain(".png");
    expect(out).toContain("placeholder");
    expect(out).toContain("UA");
  });

  test("mask with no picture shows a neutral block, not a file request", () => {
    const out = render("mask", { src: "" });
    expect(out).not.toContain(".jpg");
    expect(out).toContain("bg-neutral");
  });

  test("hover gallery with no pictures shows neutral slots, not file requests", () => {
    const out = render("hover-gallery", { images: "" });
    expect(out).not.toContain(".jpg");
    expect(out).toContain("bg-neutral");
  });

  test("a set picture still renders its own address", () => {
    expect(render("avatar", { src: "https://example.com/face.png" })).toContain(
      "https://example.com/face.png",
    );
    expect(render("mask", { src: "https://example.com/shape.jpg" })).toContain(
      "https://example.com/shape.jpg",
    );
  });

  test("new inserts use empty picture defaults", () => {
    for (const [component, field] of [
      ["avatar", "src"],
      ["mask", "src"],
      ["hover-gallery", "images"],
    ] as const) {
      const def = DAISY_COMPONENT_CATALOG.find((d) => d.id === component)!;
      expect(def.fields.find((f) => f.key === field)?.default).toBe("");
    }
  });
});
