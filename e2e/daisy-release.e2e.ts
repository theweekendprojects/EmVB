import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("daisyUI release qualification",()=>{
 test("published page has no serious accessibility violations",async({page})=>{await page.goto(process.env.DAISY_E2E_ROUTE??"/");const results=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();expect(results.violations.filter(item=>item.impact==="critical"||item.impact==="serious")).toEqual([]);});
 test("modal opens, closes with Escape and restores focus",async({page})=>{await page.goto(process.env.DAISY_INTERACTIVE_ROUTE??"/daisy-interactive");const trigger=page.locator('[data-daisy-command="show-modal"]').first();await trigger.click();const dialog=page.locator("dialog[open]");await expect(dialog).toBeVisible();await page.keyboard.press("Escape");await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();});
 test("tabs support arrows Home and End",async({page})=>{await page.goto(process.env.DAISY_INTERACTIVE_ROUTE??"/daisy-interactive");const tabs=page.getByRole("tab");await tabs.first().focus();await page.keyboard.press("End");await expect(tabs.last()).toBeFocused();await page.keyboard.press("Home");await expect(tabs.first()).toBeFocused();await page.keyboard.press("ArrowRight");await expect(tabs.nth(1)).toBeFocused();});
});
