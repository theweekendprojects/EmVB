import { describe, expect, test } from "bun:test";
// The same serializer the public renderer uses; a refused tag or attribute throws here.
import { serialize } from "../../../emvb/src/core/render/vnode.ts";
import { createDaisyUIProvider } from "../render/provider.ts";
import { DAISY_COMPONENT_CATALOG } from "./index.ts";

// Every daisyUI component's default markup must pass the output allowlist, or it disappears on the
// public page. Two components set an inline `style` (countdown, radial progress); `style` is refused
// by name (W-091), so they are listed as known until that decision is made.
const KNOWN_REFUSED_BY_STYLE_DECISION = ["countdown", "radial-progress"];

describe("every daisyUI component's markup passes the output allowlist", () => {
  const provider = createDaisyUIProvider(DAISY_COMPONENT_CATALOG);
  test("only the components waiting on the style decision are refused", () => {
    const refused: string[] = [];
    for (const definition of DAISY_COMPONENT_CATALOG) {
      const node = provider.createNode(definition.id, "chk00001");
      try {
        serialize(provider.render(node) as never);
      } catch {
        refused.push(definition.id);
      }
    }
    expect(refused.sort()).toEqual([...KNOWN_REFUSED_BY_STYLE_DECISION].sort());
  });
});
