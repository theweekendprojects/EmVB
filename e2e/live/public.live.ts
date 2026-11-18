import { expect, test } from "@playwright/test";

// Public pages on the live site: they render, load without script errors, and their images
// resolve. Nothing here signs in or writes content.

const pages = ["/", "/posts", "/search", "/pages/daisyui-test-v3"];

for (const path of pages) {
  test(`${path} renders with no page errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.goto(path, { waitUntil: "load" });
    expect(response?.status(), path).toBe(200);
    expect(errors, `script errors on ${path}`).toEqual([]);
    await expect(page.locator("h1").first()).toBeVisible();
  });
}

test("the stylesheet the daisyUI pages need is served as CSS", async ({ request }) => {
  const response = await request.get("/styles/emvb-daisyui.css");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"] ?? "").toContain("text/css");
});

test("the RSS feed is well-formed XML", async ({ request }) => {
  const response = await request.get("/rss.xml");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body.trimStart().startsWith("<?xml")).toBe(true);
  expect(body).toContain("<channel>");
});

test("an unknown page answers 404 instead of a server error", async ({ request }) => {
  const response = await request.get("/this-page-does-not-exist-e2e");
  expect(response.status()).toBe(404);
});

test("the daisyUI sections page shows its sections as cards", async ({ page }) => {
  await page.goto("/pages/daisyui-test-v3", { waitUntil: "load" });
  const cards = page.locator(".card");
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(10);
  await expect(page.getByRole("heading", { name: "Starter", exact: true }).first()).toBeVisible();
});

test("images on the daisyUI sections page all load", async ({ page }) => {
  await page.goto("/pages/daisyui-test-v3", { waitUntil: "load" });
  const broken = await page.evaluate(() =>
    [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.getAttribute("src")),
  );
  expect(broken, "broken image sources").toEqual([]);
});
