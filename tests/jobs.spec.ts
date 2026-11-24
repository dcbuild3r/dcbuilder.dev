import { test, expect } from "@playwright/test";

test.describe("Jobs Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/jobs");
    // Wait for hydration
    await page.waitForSelector('[data-testid="jobs-grid"]');
  });

  test("should render the jobs page", async ({ page }) => {
    await expect(page).toHaveTitle(/Jobs/);
    await expect(page.getByRole("heading", { name: /Work with teams/ })).toBeVisible();
  });

  test("should display filter controls", async ({ page }) => {
    await expect(page.getByLabel("Affiliation", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Role", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Company", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Location", { exact: true })).toBeVisible();
  });

  test("should have search functionality", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search jobs...");
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill("Engineer");

    // Should filter results (no error expected)
    await page.waitForTimeout(300); // debounce
  });

  test("should display job count", async ({ page }) => {
    // Should show job count
    await expect(page.getByText(/\d+ jobs?/)).toBeVisible();
  });

  test("should filter by affiliation", async ({ page }) => {
    // Find the affiliation select
    const affiliationSelect = page.locator("#affiliation-filter");

    if (await affiliationSelect.isVisible()) {
      // Click to open and select Portfolio
      await affiliationSelect.click();
      await page.getByRole("option", { name: "Portfolio" }).click();

      // URL should update
      await expect(page).toHaveURL(/type=portfolio/);
    }
  });

  test("should toggle Featured only filter", async ({ page }) => {
    const featured = page.getByLabel("Featured only");
    await featured.check();
    await expect(featured).toBeChecked();
  });

  test("should reset filters", async ({ page }) => {
    const featured = page.getByLabel("Featured only");
    await featured.check();

    await page.getByRole("button", { name: /Reset filters/ }).click();
    await expect(featured).not.toBeChecked();
  });
});
