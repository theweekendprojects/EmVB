import { afterEach, describe, expect, test } from "bun:test";
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { AddPanel } from "./AddPanel.tsx";
import { registerDaisyUIProvider } from "@perkyzz/emvb-daisyui";

registerDaisyUIProvider(); // make the daisyUI provider's components + recipes available to AddPanel

let root: Root | undefined;
afterEach(() => { act(() => root?.unmount()); document.body.textContent = ""; root = undefined; });

const mount = async (node: React.ReactNode) => {
  const host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(node));
};

describe("WP14 daisyUI recipe palette integration", () => {
  test("shows and searches daisyUI recipes", async () => {
    await mount(<AddPanel onAdd={() => undefined} onRecipe={() => undefined} defaultQuery="pricing" />);
    const tile = document.querySelector<HTMLButtonElement>('[data-emvb-recipe="provider:daisyui:pricing"]');
    expect(tile?.textContent).toContain("Pricing section");
    expect(tile?.textContent).toContain("daisyUI");
  });

  test("passes a namespaced recipe identifier", async () => {
    const seen: string[] = [];
    await mount(<AddPanel onAdd={() => undefined} onRecipe={(id) => seen.push(id)} defaultQuery="dashboard statistics" />);
    document.querySelector<HTMLButtonElement>('[data-emvb-recipe="provider:daisyui:dashboard-stats"]')?.click();
    expect(seen).toEqual(["provider:daisyui:dashboard-stats"]);
  });
});
