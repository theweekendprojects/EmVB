import { describe, expect, test } from "bun:test";
import { CATALOG_CLASS_NAMES } from "../catalog/class-names.ts";
import { DAISY_COMPONENT_CATALOG } from "../catalog/index.ts";
import { catalogClassNames, classNamesModule } from "./class-names.ts";

// The literal list must match the catalog. If a component or option changes, run
// `bun run --cwd packages/emvb-daisyui classes:write`; this test fails until the list is refreshed.
describe("catalog class names are written out for the scanner", () => {
  test("the literal list matches the catalog", () => {
    expect([...CATALOG_CLASS_NAMES]).toEqual(catalogClassNames(DAISY_COMPONENT_CATALOG));
  });

  test("option classes are present as literal names (the case the scanner missed)", () => {
    for (const name of ["btn-accent", "btn-md", "input-neutral", "loading-spinner", "toast-end"])
      expect(CATALOG_CLASS_NAMES).toContain(name as never);
  });

  test("the module source is what the writer produces", () => {
    expect(classNamesModule([...CATALOG_CLASS_NAMES])).toContain('"btn-accent",');
  });
});
