/// <reference types="bun" />
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DAISY_COMPONENT_CATALOG } from "../catalog/index.ts";
import { catalogSupportReport } from "./report.ts";
import { verifyCompiledCss } from "./verify-css.ts";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = resolve(here, "../..");
const output = resolve(process.argv[2] ?? `${pkg}/generated/official-daisyui.css`);
const reportPath = resolve(process.argv[3] ?? `${pkg}/generated/official-conformance.json`);
await mkdir(dirname(output), { recursive: true });
await mkdir(resolve(pkg, "conformance"), { recursive: true });
const classes = new Set<string>();
for (const definition of DAISY_COMPONENT_CATALOG) {
  definition.rootClass.split(/\s+/).filter(Boolean).forEach((value) => classes.add(value));
  for (const field of definition.fields) Object.values(field.classMap ?? {}).flatMap((value) => value.split(/\s+/)).filter(Boolean).forEach((value) => classes.add(value));
}
await writeFile(resolve(pkg, "conformance/safelist.html"), `<main class="${[...classes].sort().join(" ")}"></main>\n`);
const command = ["bun", "run", "--cwd", resolve(pkg, "../../demos/cloudflare"), "vite", "build", "--config", "daisy-conformance.vite.config.ts"];
const child = Bun.spawn(command, { cwd: pkg, stdout: "inherit", stderr: "inherit" });
const exitCode = await child.exited;
if (exitCode !== 0) throw new Error(`Official CSS compilation failed with exit code ${exitCode}.`);
const dist = resolve(pkg, "../../demos/cloudflare/dist-daisy-conformance/assets");
const files = Array.from(new Bun.Glob("*.css").scanSync(dist));
if (files.length !== 1) throw new Error(`Expected one compiled CSS asset, found ${files.length}.`);
const compiled = resolve(dist, files[0]!);
await Bun.write(output, Bun.file(compiled));
const css = await Bun.file(output).text();
const verifiedBoundary = verifyCompiledCss(css);
const rootSelectors = DAISY_COMPONENT_CATALOG.map((definition) => `.${definition.rootClass.split(/\s+/)[0]}`).filter((selector, index, list) => list.indexOf(selector) === index);
const missingRootSelectors = rootSelectors.filter((selector) => !css.includes(selector));
const support = catalogSupportReport();
const report = { generatedAt: new Date().toISOString(), command, cssBytes: new TextEncoder().encode(css).length, versions: { daisyui: support.daisyuiVersion, tailwindcss: support.tailwindcssVersion }, officialTotal: support.officialTotal, implemented: support.implemented, verifiedBoundary, checkedRootSelectors: rootSelectors.length, missingRootSelectors, ok: verifiedBoundary.ok && missingRootSelectors.length === 0 };
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) { console.error(JSON.stringify(report, null, 2)); process.exit(1); }
console.log(`Official conformance passed: ${report.checkedRootSelectors} root selectors, ${report.cssBytes} CSS bytes.`);
