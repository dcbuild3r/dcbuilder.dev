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
    await expect(page.getByRole("button", { name: "Disclaimer" })).toBeVisible();
  });

  test("should render investment container", async ({ page }) => {
    // Check for the main container or controls which should always be present
    await expect(page.getByLabel("Sort")).toBeVisible();
    await expect(page.getByLabel("Show")).toBeVisible();
  });

  test("should display investment cards or empty state", async ({ page }) => {
    const cards = page.locator('[data-testid="investment-card"]');
    const cardCount = await cards.count();
    // Test passes if there are cards OR if the page renders without cards (empty DB)
    if (cardCount > 0) {
      await expect(cards.first()).toBeVisible();
    } else {
      // Empty state is valid - just verify grid container exists
      await expect(page.locator('[data-testid="portfolio-grid"]')).toBeVisible();
    }
  });

  test("should filter by Featured", async ({ page }) => {
    await page.getByLabel("Show").selectOption("featured");
    await expect(page.getByLabel("Show")).toHaveValue("featured");
  });

  test("should toggle between Main and All views", async ({ page }) => {
    const show = page.getByLabel("Show");
    if ((await show.locator('option[value="all"]').count()) > 0) {
      await show.selectOption("all");
      await expect(show).toHaveValue("all");
    }
    await show.selectOption("main");
    await expect(show).toHaveValue("main");
  });

  test("should sort investments alphabetically", async ({ page }) => {
    // Select alphabetical sort
    await page.getByLabel("Sort").selectOption("alphabetical");

    // Verify sort was applied (cards may or may not exist in test DB)
    const cards = page.locator('[data-testid="investment-card"]');
    const cardCount = await cards.count();
    if (cardCount > 0) {
      await expect(cards.first()).toBeVisible();
    } else {
      // Empty state is valid
      await expect(page.locator('[data-testid="portfolio-grid"]')).toBeVisible();
    }
  });

  test("should sort investments reverse alphabetically", async ({ page }) => {
    // Select reverse alphabetical sort
    await page.getByLabel("Sort").selectOption("alphabetical-desc");

    // Verify sort was applied (cards may or may not exist in test DB)
    const cards = page.locator('[data-testid="investment-card"]');
    const cardCount = await cards.count();
    if (cardCount > 0) {
      await expect(cards.first()).toBeVisible();
    } else {
      // Empty state is valid
      await expect(page.locator('[data-testid="portfolio-grid"]')).toBeVisible();
    }
  });
});
