import { describe, expect, test } from "bun:test";
import { generateComponent, validateDefinition } from "./generate.ts";
import { generateSafelistCss } from "./artifacts.ts";

const definition = {
  id: "button",
  label: "Button",
  category: "Actions",
  tag: "button",
  rootClass: "btn",
  fields: [
    { key: "label", label: "Label", kind: "text", default: "Button", textContent: true },
    { key: "tone", label: "Tone", kind: "select", default: "primary", options: ["primary", "error"], classMap: { primary: "btn-primary", error: "btn-error" } },
  ],
} as const;

describe("component generator", () => {
  test("creates descriptor defaults and an allowlisted VNode", () => {
    const generated = generateComponent(definition);
    expect(generated.descriptor.fields[1]?.key).toBe("props.tone");
    const node = { id: "x", ...generated.defaults() };
    expect(generated.build(node)).toEqual({ tag: "button", attrs: { class: "btn btn-primary" }, children: ["Button"] });
  });
  test("rejects incomplete class maps", () => {
    expect(() => validateDefinition({ ...definition, fields: [{ ...definition.fields[1], classMap: { primary: "btn-primary" } }] } as any)).toThrow("missing class");
  });
  test("generates a deterministic safelist", () => expect(generateSafelistCss([definition])).toContain(".btn-primary {}"));
});
