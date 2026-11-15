import { writeFileSync } from "node:fs";
import { DAISY_COMPONENT_CATALOG } from "../catalog/index.ts";
import { catalogClassNames, classNamesModule } from "./class-names.ts";

writeFileSync(
  new URL("../catalog/class-names.ts", import.meta.url),
  classNamesModule(catalogClassNames(DAISY_COMPONENT_CATALOG)),
);
console.log("wrote src/catalog/class-names.ts");
