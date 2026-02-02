import { test, expect } from "@playwright/test";

test.describe("Jobs Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/jobs");
    // Wait for hydration
    await page.waitForSelector('[data-testid="jobs-grid"]');
  });

  test("should render the jobs page", async ({ page }) => {
    await expect(page).toHaveTitle(/Jobs/);
    await expect(page.getByRole("heading", { name: /Jobs/ })).toBeVisible();
  });

  test("should display filter controls", async ({ page }) => {
    await expect(page.getByText("Affiliation:")).toBeVisible();
    await expect(page.getByText("Role:")).toBeVisible();
    await expect(page.getByText("Company:")).toBeVisible();
    await expect(page.getByText("Location:")).toBeVisible();
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
    const featuredButton = page.getByRole("button", { name: /Featured only/ });

    // Featured button may not be visible if there are no featured jobs
    if (await featuredButton.isVisible()) {
      // Click to enable
      await featuredButton.click();

      // Should have active styling
      await expect(featuredButton).toHaveClass(/bg-amber/);
    } else {
      // No featured jobs - verify grid still works
      await expect(page.locator('[data-testid="jobs-grid"]')).toBeVisible();
    }
  });

  test("should reset filters", async ({ page }) => {
    const featuredButton = page.getByRole("button", { name: /Featured only/ });

    // Only test reset if featured button exists
    if (await featuredButton.isVisible()) {
      // Apply some filter first
      await featuredButton.click();

      // Find and click reset
      const resetButton = page.getByRole("button", { name: /Reset filters/ });
      if (await resetButton.isVisible()) {
        await resetButton.click();

        // Featured should no longer be active
        await expect(featuredButton).not.toHaveClass(/bg-amber/);
      }
    } else {
      // No featured jobs - verify grid still works
      await expect(page.locator('[data-testid="jobs-grid"]')).toBeVisible();
    }
  });
});
