import { describe, expect, test } from "bun:test";
import { DAISY_COMPONENT_CATALOG } from "../catalog/index.ts";
import { daisyUIProvider } from "../provider.ts";

const render = (component: string, props: Record<string, string | number | boolean>) =>
  daisyUIProvider.render({ id: "test", type: "daisy", component, props });

describe("WP4 basic daisyUI components", () => {
  test("catalog contains six generated components", () => expect(DAISY_COMPONENT_CATALOG.map(item => item.id)).toEqual(["button", "badge", "alert", "card", "progress", "stats"]));
  test("button uses semantic allowlisted classes", () => expect(render("button", { label: "Save", tone: "success", variant: "outline", size: "lg", disabled: false })).toEqual({ tag: "button", attrs: { class: "btn btn-success btn-outline btn-lg" }, children: ["Save"] }));
  test("alert receives an accessible role", () => expect(render("alert", { message: "Saved", tone: "success", variant: "soft" }).attrs.role).toBe("alert"));
  test("card produces body structure", () => expect(JSON.stringify(render("card", { title: "Plan", body: "Details", bordered: true, size: "md" }))).toContain("card-body"));
  test("progress maps numeric attributes", () => expect(render("progress", { value: 60, max: 100, tone: "primary" }).attrs).toEqual({ value: "60", max: "100", class: "progress progress-primary" }));
  test("stats creates semantic stat parts", () => expect(JSON.stringify(render("stats", { title: "Users", value: "31K", description: "+12%", direction: "horizontal" }))).toContain("stat-value"));
  test("raw classes cannot be injected through props", () => expect(JSON.stringify(render("badge", { label: "Safe", tone: "fixed top-0", variant: "solid" }))).not.toContain("fixed"));
});
