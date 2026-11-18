import { writeFile } from "node:fs/promises";
import { catalogSupportReport } from "./report.ts";
const output = process.argv[2] ?? "generated/daisyui-support-report.json";
await writeFile(output, `${JSON.stringify(catalogSupportReport(), null, 2)}\n`);
console.log(`Wrote ${output}`);
