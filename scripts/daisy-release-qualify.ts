/// <reference types="bun" />
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const artifacts = resolve(process.argv[2] ?? `${root}/artifacts/daisy-release`);
await mkdir(artifacts, { recursive: true });
type Status = "PASS" | "FAIL" | "BLOCKED";
type Gate = { name: string; status: Status; command?: string; exitCode?: number; log?: string; detail?: string };
const gates: Gate[] = [];
async function run(name: string, command: string[]): Promise<void> {
  const log = resolve(artifacts, `${name.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}.log`);
  const child = Bun.spawn(command, { cwd: root, stdout: "pipe", stderr: "pipe", env: process.env });
  const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  await writeFile(log, `${stdout}${stderr}`);
  gates.push({ name, status: exitCode === 0 ? "PASS" : "FAIL", command: command.join(" "), exitCode, log });
}
await run("provider-api-tests", ["bun","run","--cwd","packages/emvb-provider-api","test"]);
await run("daisy-tests", ["bun","run","--cwd","packages/emvb-daisyui","test"]);
await run("provider-build", ["bun","providers:build"]);
await run("provider-smoke", ["bun","providers:smoke"]);
await run("official-css-conformance", ["bun","daisy:conformance"]);
await run("repository-check", ["bun","run","check"]);
await run("cloudflare-build", ["bun","run","demo:cf:build"]);
if (process.env.DAISY_QUALIFY_BROWSERS === "1") await run("playwright", ["bunx","playwright","test","e2e/daisy-release.e2e.ts","--project=chromium"]);
else gates.push({ name:"playwright", status:"BLOCKED", detail:"Set DAISY_QUALIFY_BROWSERS=1 after installing Playwright browsers." });
const live = process.env.DAISY_LIVE_URL;
if (live) await run("live-worker", ["bun","scripts/daisy-live-check.ts",live]);
else gates.push({ name:"live-worker", status:"BLOCKED", detail:"Set DAISY_LIVE_URL to a deployed consuming Cloudflare Worker." });
const verdict: Status = gates.some(g=>g.status==="FAIL") ? "FAIL" : gates.some(g=>g.status==="BLOCKED") ? "BLOCKED" : "PASS";
const result = { verdict, generatedAt:new Date().toISOString(), commit:(await Bun.$`git rev-parse HEAD`.quiet().text()).trim(), gates };
await writeFile(resolve(artifacts,"result.json"),`${JSON.stringify(result,null,2)}\n`);
await writeFile(resolve(artifacts,"WP30-RELEASE-QUALIFICATION.md"),`# WP30 release qualification\n\nVerdict: **${verdict}**\n\n${gates.map(g=>`- ${g.status}: ${g.name}${g.detail?` — ${g.detail}`:""}`).join("\n")}\n`);
console.log(JSON.stringify(result,null,2));
if (verdict === "FAIL") process.exit(1);
