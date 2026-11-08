import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DAISY_COMPONENT_CATALOG } from "../catalog/index.ts";
import { generateGallery, generateSafelistCss } from "./artifacts.ts";
import { validateDefinition } from "./generate.ts";

const here = dirname(fileURLToPath(import.meta.url));
const generated = resolve(here, "../../generated");
await mkdir(generated, { recursive: true });
const ids = new Set<string>();
for (const definition of DAISY_COMPONENT_CATALOG) {
  validateDefinition(definition);
  if (ids.has(definition.id)) throw new Error(`Duplicate component id: ${definition.id}`);
  ids.add(definition.id);
}
await Promise.all([
  writeFile(resolve(generated, "safelist.css"), generateSafelistCss(DAISY_COMPONENT_CATALOG)),
  writeFile(resolve(generated, "component-gallery.json"), generateGallery(DAISY_COMPONENT_CATALOG)),
]);
console.log(`Generated ${DAISY_COMPONENT_CATALOG.length} daisyUI components.`);
