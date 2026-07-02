import { test, expect } from "@playwright/test";
import { createTestToken } from "./auth.setup";

const dashboardPages = [
  { path: "/dashboard", name: "Dashboard" },
  { path: "/memos", name: "Memos" },
  { path: "/knowledge", name: "Knowledge" },
  { path: "/content", name: "Content" },
  { path: "/leads", name: "Leads" },
  { path: "/analytics", name: "Analytics" },
  { path: "/sites", name: "Sites" },
  { path: "/settings", name: "Settings" },
];

test.describe("Dashboard Pages (authenticated)", () => {
  for (const { path, name } of dashboardPages) {
    test(`${name} page loads`, async ({ page, context }) => {
      const token = await createTestToken();
      await context.addCookies([
        { name: "vertax_token", value: token, path: "/", domain: "localhost" },
      ]);

      const resp = await page.goto(path);
      expect(resp?.status()).toBe(200);

      // 不应被重定向到 /login
      expect(page.url()).not.toContain("/login");
    });
  }
});
