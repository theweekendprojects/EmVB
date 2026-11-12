import { afterEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ProviderMetaFields } from "./ProviderMetaFields.tsx";
import type { LayoutNode } from "../../../../core/index.ts";

let root: Root | undefined;
afterEach(() => { act(() => root?.unmount()); document.body.textContent = ""; root = undefined; });
const node: LayoutNode = { id: "theme-node", type: "provider", provider: "daisyui", component: "button", props: { label: "Save" }, providerMeta: { theme: "corporate" } };

describe("WP15 provider theme field", () => {
  test("shows a Daisy theme control only for daisyUI nodes", async () => {
    const host = document.createElement("div"); document.body.append(host); root = createRoot(host);
    await act(async () => root!.render(<ProviderMetaFields node={node} onChange={() => undefined} />));
    expect(document.querySelector('[data-emvb-provider-meta="theme"]')).not.toBeNull();
  });
});
