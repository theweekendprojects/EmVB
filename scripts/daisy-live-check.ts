/// <reference types="bun" />
const base = process.argv[2];
if (!base) throw new Error("Usage: bun scripts/daisy-live-check.ts <base-url>");
const routes = { empty: process.env.DAISY_EMPTY_ROUTE ?? "/", static: process.env.DAISY_STATIC_ROUTE ?? "/daisy-static", interactive: process.env.DAISY_INTERACTIVE_ROUTE ?? "/daisy-interactive" };
const get = async (path: string) => { const response=await fetch(new URL(path,base)); if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`); return response.text(); };
const [empty,stat,interactive]=await Promise.all([get(routes.empty),get(routes.static),get(routes.interactive)]);
const hasCss=(html:string)=>html.includes("daisyui.css")||html.includes("data-theme=\"light\"");
const hasRuntime=(html:string)=>html.includes("data-daisy-command")||html.includes("showModal")||html.includes("ArrowRight");
if(hasCss(empty)||hasRuntime(empty))throw new Error("Empty route unexpectedly contains daisyUI assets.");
if(!hasCss(stat)||hasRuntime(stat))throw new Error("Static route must contain CSS and no interactive runtime.");
if(!hasCss(interactive)||!hasRuntime(interactive))throw new Error("Interactive route must contain CSS and runtime.");
console.log("Live Worker asset qualification passed.");
