import { describe, expect, test } from "bun:test";
import { DAISY_RUNTIME_SCRIPT, nodeForRender, serializableNode } from "../runtime/index.ts";
import type { DaisyComponentNode } from "../types.ts";
const modal: DaisyComponentNode = { id: "modal-1", type: "provider", provider: "daisyui", component: "modal", props: { label: "Confirm", open: true, defaultOpen: false } };
describe("R7 runtime and editor preview separation", () => {
  test("removes transient state from public and serialized nodes", () => {
    expect(nodeForRender(modal, { mode: "public" }).props.open).toBeUndefined();
    expect(serializableNode(modal).props.open).toBeUndefined();
  });
  test("applies editor preview without persisting it", () => {
    expect(nodeForRender(modal, { mode: "editor", previewState: { "modal-1": { open: true } } }).props.open).toBe(true);
    expect(serializableNode(modal).props.open).toBeUndefined();
  });
  test("runtime uses native dialog methods", () => { expect(DAISY_RUNTIME_SCRIPT).toContain("showModal"); expect(DAISY_RUNTIME_SCRIPT).toContain("close"); });
});
