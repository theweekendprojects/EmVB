import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const required = [
  resolve(root, "packages/emvb-provider-api/dist/index.js"),
  resolve(root, "packages/emvb-daisyui/dist/index.js"),
  resolve(root, "packages/emvb-daisyui/dist/styles.css"),
  resolve(root, "packages/emvb-daisyui/dist/catalog/index.js"),
  resolve(root, "packages/emvb-daisyui/dist/conformance/index.js"),
];
for (const file of required) if (!existsSync(file)) throw new Error(`Missing distribution file: ${file}`);

const apiModule = await import("@perkyzz/emvb-provider-api");
const daisyModule = await import("@perkyzz/emvb-daisyui");
const catalogModule = await import("@perkyzz/emvb-daisyui/catalog");
const conformanceModule = await import("@perkyzz/emvb-daisyui/conformance");
if (typeof apiModule.registerComponentProvider !== "function") throw new Error("Provider registry is missing from package exports.");
if (!daisyModule.daisyUIProvider?.components?.has("button")) throw new Error("daisyUI Button is missing from package exports.");
if (!Array.isArray(catalogModule.DAISY_COMPONENT_CATALOG)) throw new Error("Catalog subpath export is invalid.");
const button = daisyModule.daisyUIProvider.createNode("button", "smoke-button");
const rendered = daisyModule.daisyUIProvider.render(button);
if (!(rendered.attrs.class ?? "").split(/\s+/).includes("btn")) throw new Error("Built Button does not render .btn.");
if (conformanceModule.DAISYUI_CONFORMANCE.daisyuiVersion !== "5.7.50") throw new Error("Built conformance version drifted.");
console.log("Provider package export smoke test passed.");
