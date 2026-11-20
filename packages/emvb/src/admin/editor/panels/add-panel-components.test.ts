import { describe, expect, test } from "bun:test";
import { addPanelComponents } from "./AddPanel.tsx";

const component = (name: string, addPanel?: boolean) => ({
  descriptor: { name, ...(addPanel === undefined ? {} : { addPanel }) },
});

describe("Add panel tiles for provider components (W-927)", () => {
  test("a component marked addPanel false gets no tile", () => {
    const tiles = addPanelComponents([component("Card", false), component("Badge", true)]);
    expect(tiles.map((t) => t.descriptor.name)).toEqual(["Badge"]);
  });

  test("a component with no addPanel flag keeps its tile", () => {
    const tiles = addPanelComponents([component("Legacy")]);
    expect(tiles.map((t) => t.descriptor.name)).toEqual(["Legacy"]);
  });
});
