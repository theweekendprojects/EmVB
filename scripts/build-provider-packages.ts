import { rm, mkdir, cp, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const api = join(root, "packages/emvb-provider-api");
const daisy = join(root, "packages/emvb-daisyui");

async function build(entrypoints: string[], outdir: string) {
  const result = await Bun.build({ entrypoints, outdir, target: "browser", format: "esm", splitting: true, sourcemap: "external", minify: false, external: ["@perkyzz/emvb-provider-api"] });
  if (!result.success) throw new Error(result.logs.map(String).join("\n"));
}

await rm(join(api, "dist"), { recursive: true, force: true });
await rm(join(daisy, "dist"), { recursive: true, force: true });
await mkdir(join(api, "dist"), { recursive: true });
await mkdir(join(daisy, "dist"), { recursive: true });

await build([join(api, "src/index.ts")], join(api, "dist"));
await build([
  join(daisy, "src/index.ts"),
  join(daisy, "src/catalog/index.ts"),
  join(daisy, "src/themes/index.ts"),
  join(daisy, "src/recipes/index.ts"),
  join(daisy, "src/validation/index.ts"),
  join(daisy, "src/compatibility/index.ts"),
  join(daisy, "src/conformance/index.ts"),
], join(daisy, "dist"));


await cp(join(daisy, "styles/emvb-daisyui.css"), join(daisy, "dist/styles.css"));

await writeFile(join(api, "dist/index.d.ts"), `export * from "../src/index.ts";\n`);
for (const name of ["index", "catalog", "themes", "recipes", "validation", "compatibility", "conformance"]) {
  const source = name === "index" ? "../src/index.ts" : `../src/${name}/index.ts`;
  await writeFile(join(daisy, "dist", `${name}.d.ts`), `export * from "${source}";\n`);
}
console.log("Built provider API and daisyUI distribution packages.");
