import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { DAISY_COMPONENT_CATALOG } from "../catalog/index.ts";
import { generateGallery, generateSafelistCss } from "./artifacts.ts";

// The committed generated files are what the editor and the CSS build read. They must match the
// catalog exactly; run `bun run generate` after a catalog change.
const generated = (name: string) =>
  readFileSync(new URL(`../../generated/${name}`, import.meta.url), "utf8");

describe("committed generated artifacts match the catalog", () => {
  test("the component gallery is current", () => {
    expect(generated("component-gallery.json")).toBe(generateGallery(DAISY_COMPONENT_CATALOG));
  });

  test("the safelist CSS is current", () => {
    expect(generated("safelist.css")).toBe(generateSafelistCss(DAISY_COMPONENT_CATALOG));
  });

  test("the avatar's picture defaults to empty, so a new avatar never points at a file", () => {
    const avatar = DAISY_COMPONENT_CATALOG.find((item) => item.id === "avatar");
    expect(avatar?.fields.find((field) => field.key === "src")?.default).toBe("");
  });
});
