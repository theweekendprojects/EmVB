import { describe, expect, test } from "bun:test";
import { daisyUIProvider } from "../provider.ts";
import { validateDaisyTree } from "../validation/index.ts";

describe("WP11 accessibility and validation", () => {
  test("accepts a labelled button", () => {
    const node = daisyUIProvider.createNode("button", "button1");
    node.props.label = "Save";
    expect(validateDaisyTree([node])).toEqual([]);
  });
  test("reports labels, options, properties, ids and nesting", () => {
    const first = daisyUIProvider.createNode("button", "same1");
    first.props.label = "";
    first.props.tone = "not-a-tone";
    first.props.unsafe = "x";
    first.children = [daisyUIProvider.createNode("badge", "child1")];
    const second = daisyUIProvider.createNode("button", "same1");
    second.props.label = "Again";
    const codes = validateDaisyTree([first, second]).map((issue) => issue.code);
    expect(codes).toContain("missing-label");
    expect(codes).toContain("invalid-option");
    expect(codes).toContain("unknown-property");
    expect(codes).toContain("invalid-nesting");
    expect(codes).toContain("duplicate-id");
  });
});
