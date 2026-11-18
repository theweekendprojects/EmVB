import { describe, expect, test } from "bun:test";
// The same serializer the public renderer uses; a refused tag or attribute throws here.
import { serialize } from "../../../emvb/src/core/render/vnode.ts";
import { createDaisyUIProvider } from "../render/provider.ts";
import { DAISY_COMPONENT_CATALOG } from "./index.ts";

// Every daisyUI component's default markup must pass the output allowlist, or it disappears on the
// public page. `style` is refused by name (W-091), so a component that needs a CSS variable carries
// it as a class (see value-class.ts) and the runtime script.
describe("every daisyUI component's markup passes the output allowlist", () => {
  const provider = createDaisyUIProvider(DAISY_COMPONENT_CATALOG);
  test("no component is refused", () => {
    const refused: string[] = [];
    for (const definition of DAISY_COMPONENT_CATALOG) {
      const node = provider.createNode(definition.id, "chk00001");
      try {
        serialize(provider.render(node) as never);
      } catch {
        refused.push(definition.id);
      }
    }
    expect(refused).toEqual([]);
  });

  test("countdown in date mode passes the allowlist too", () => {
    const node = provider.createNode("countdown", "chk00002");
    node.props.target = "2099-12-31T00:00:00Z";
    expect(() => serialize(provider.render(node) as never)).not.toThrow();
  });
});
