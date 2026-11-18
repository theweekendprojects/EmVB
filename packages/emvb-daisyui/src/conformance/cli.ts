import { verifyCompiledCss } from "./verify-css.ts";
const file = process.argv[2];
if (!file) throw new Error("Usage: bun src/conformance/cli.ts <compiled.css>");
const result = verifyCompiledCss(await Bun.file(file).text());
if (!result.ok) {
  console.error(`Missing official selectors: ${result.missing.join(", ")}`);
  process.exit(1);
}
console.log(`Verified ${result.checked} official daisyUI selectors.`);
