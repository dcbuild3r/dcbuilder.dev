import { test, expect } from "@playwright/test";

test.describe("Portfolio Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portfolio");
    // Wait for hydration
    await page.waitForSelector('[data-testid="portfolio-grid"]');
  });

  test("should render the portfolio page", async ({ page }) => {
    await expect(page).toHaveTitle(/Portfolio/);
    await expect(
      page.getByRole("heading", { name: "Investments" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Disclaimer" })
    ).toBeVisible();
  });

  test("should render investment container", async ({ page }) => {
    // Check for the main container or controls which should always be present
    await expect(page.getByText("Sort by:")).toBeVisible();
    await expect(page.getByRole("button", { name: /Main/ })).toBeVisible();
  });

  test("should display investment cards", async ({ page }) => {
    const cards = page.locator('[data-testid="investment-card"]');
    // Should have at least one investment card
    await expect(cards.first()).toBeVisible();
  });

  test("should filter by Featured", async ({ page }) => {
    // Click Featured filter
    await page.getByRole("button", { name: /Featured/ }).click();

    // Verify the button is now selected (has active styling)
    const featuredButton = page.getByRole("button", { name: /Featured/ });
    await expect(featuredButton).toHaveClass(/bg-amber/);
  });

  test("should toggle between Main and All views", async ({ page }) => {
    // Click All to show all investments
    const allButton = page.getByRole("button", { name: /All/ });
    if (await allButton.isVisible()) {
      await allButton.click();
      await expect(allButton).toHaveClass(/bg-neutral-900|bg-white/);
    }

    // Click Main to filter
    await page.getByRole("button", { name: /Main/ }).click();
    await expect(page.getByRole("button", { name: /Main/ })).toHaveClass(
      /bg-neutral-900|bg-white/
    );
  });

  test("should sort investments alphabetically", async ({ page }) => {
    // Select alphabetical sort
    await page.getByRole("combobox").selectOption("alphabetical");

    // Get first card and verify it exists
    const firstCard = page.locator('[data-testid="investment-card"]').first();
    await expect(firstCard).toBeVisible();
  });

  test("should sort investments reverse alphabetically", async ({ page }) => {
    // Select reverse alphabetical sort
    await page.getByRole("combobox").selectOption("alphabetical-desc");

    // Get first card and verify it exists
    const firstCard = page.locator('[data-testid="investment-card"]').first();
    await expect(firstCard).toBeVisible();
  });
});
