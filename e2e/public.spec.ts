import { test, expect } from "@playwright/test";

test.describe("Public API Endpoints", () => {
  test("site preview returns 404 for nonexistent site", async ({ request }) => {
    const resp = await request.get(
      "/api/sites/00000000-0000-0000-0000-000000000000/preview"
    );
    expect(resp.status()).toBe(404);
  });

  test("site chat returns 404 for nonexistent site", async ({ request }) => {
    const resp = await request.post(
      "/api/sites/00000000-0000-0000-0000-000000000000/chat",
      { data: { question: "Hello" } }
    );
    expect(resp.status()).toBe(404);
  });

  test("site chat returns 400 for empty question", async ({ request }) => {
    const resp = await request.post(
      "/api/sites/00000000-0000-0000-0000-000000000000/chat",
      { data: { question: "" } }
    );
    expect(resp.status()).toBe(400);
  });

  test("home page returns 200 with SEO meta", async ({ page }) => {
    const resp = await page.goto("/");
    expect(resp?.status()).toBe(200);

    const title = await page.title();
    expect(title).toContain("VertaX");

    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute("content");
  });
});
