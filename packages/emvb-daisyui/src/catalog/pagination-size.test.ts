import { describe, expect, test } from "bun:test";
import { createDaisyUIProvider } from "../render/provider.ts";
import { DAISY_COMPONENT_CATALOG } from "./index.ts";

// daisyUI 5.7.50 has no join size classes (join-xs ... join-xl do not exist). A pagination size must
// reach its page buttons as btn-* classes, which do exist.
const provider = createDaisyUIProvider(DAISY_COMPONENT_CATALOG);

describe("pagination size reaches the buttons", () => {
  test("lg puts btn-lg on each page and no join size class", () => {
    const node = provider.createNode("pagination", "pag00001");
    const out = JSON.stringify(
      provider.render({ ...node, props: { ...node.props, size: "lg" } } as never),
    );
    expect(out).toContain("btn-lg");
    expect(out).not.toMatch(/join-(xs|sm|md|lg|xl)\b/);
  });
});
