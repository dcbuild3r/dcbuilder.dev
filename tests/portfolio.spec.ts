import { test, expect } from "@playwright/test";

test.describe("Portfolio Page", () => {
  test("should render the portfolio page", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page).toHaveTitle(/Portfolio/);
    await expect(page.getByRole("heading", { name: "Investments" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Disclaimer" })).toBeVisible();
  });

  test("should render investment container", async ({ page }) => {
    await page.goto("/portfolio");
    // Check for the main container or controls which should always be present
    await expect(page.getByText("Sort by:")).toBeVisible();
    await expect(page.getByRole("button", { name: /Main/ })).toBeVisible();
  });
});
