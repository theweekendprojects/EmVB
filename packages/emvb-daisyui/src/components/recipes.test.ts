import { describe, expect, test } from "bun:test";
import { createRecipe, DAISY_RECIPES } from "../recipes/index.ts";
import { daisyUIProvider } from "../provider.ts";
import { validateDaisyTree } from "../validation/index.ts";

const ids = () => { let value = 0; return () => `recipe${++value}`; };

describe("WP10 recipes", () => {
  test("ships ten named recipes", () => expect(DAISY_RECIPES).toHaveLength(10));
  test("every recipe creates unique, registered component nodes", () => {
    for (const recipe of DAISY_RECIPES) {
      const nodes = createRecipe(recipe.id, ids());
      expect(nodes.length).toBeGreaterThan(0);
      expect(validateDaisyTree(nodes)).toEqual([]);
      const seen = new Set<string>();
      const walk = (node: any) => {
        expect(daisyUIProvider.components.has(node.component)).toBe(true);
        expect(seen.has(node.id)).toBe(false);
        seen.add(node.id);
        node.children?.forEach(walk);
      };
      nodes.forEach(walk);
    }
  });
});
