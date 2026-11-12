import { describe, expect, test } from "bun:test";
import {
  auditVerifiedPrimitive,
  primitiveSignature,
  renderVerifiedPrimitive,
  VERIFIED_PRIMITIVE_IDS,
} from "../verified/primitives.ts";
import { daisyUIProvider } from "../provider.ts";

describe("R5 verified primitive subset", () => {
  test("all ten primitives render their official root class without audit errors", () => {
    for (const id of VERIFIED_PRIMITIVE_IDS) {
      const node = daisyUIProvider.createNode(id, `verified-${id}`);
      expect(auditVerifiedPrimitive(node), id).toEqual([]);
      const vnode = renderVerifiedPrimitive(node);
      expect(vnode.attrs.class?.split(/\s+/)).toContain(id === "button" ? "btn" : id);
      expect(primitiveSignature(vnode)).toContain(vnode.tag);
    }
  });
  test("blocks unnamed controls and invalid progress ranges", () => {
    const input = daisyUIProvider.createNode("input", "input-a");
    input.props.label = "";
    expect(auditVerifiedPrimitive(input)[0]?.code).toBe("accessible-name");
    const progress = daisyUIProvider.createNode("progress", "progress-a");
    progress.props.value = 120;
    progress.props.max = 100;
    expect(auditVerifiedPrimitive(progress)[0]?.code).toBe("progress-range");
  });
});
