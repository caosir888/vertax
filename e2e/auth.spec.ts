import { test, expect } from "@playwright/test";

test.describe("Auth & Routing", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1, h2, .text-lg, .text-xl").first()).toBeVisible();
  });

  const protectedRoutes = [
    "/dashboard",
    "/memos",
    "/knowledge",
    "/content",
    "/leads",
    "/analytics",
    "/sites",
    "/settings",
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to /login without auth`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain("/login");
    });
  }
});
