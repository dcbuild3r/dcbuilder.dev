import { test, expect } from "@playwright/test";

test.describe("Candidates Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/candidates");
    // Wait for hydration
    await page.waitForSelector('[data-testid="candidates-grid"][data-hydrated="true"]');
  });

  test("should render the candidates page", async ({ page }) => {
    await expect(page).toHaveTitle(/Candidates/);
    await expect(
      page.getByRole("heading", { name: /Candidates/ })
    ).toBeVisible();
  });

  test("should display filter controls", async ({ page }) => {
    await expect(page.getByText("Status:")).toBeVisible();
    await expect(page.getByText("Experience:")).toBeVisible();
  });

  test("should have search functionality", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search candidates...");
    await expect(searchInput).toBeVisible();

    // Type in search
    await searchInput.fill("Developer");

    // Wait for filter to apply
    await page.waitForTimeout(300);
  });

  test("should display candidate count", async ({ page }) => {
    // Should show candidate count
    await expect(page.getByText(/\d+ candidates?/)).toBeVisible();
  });

  test("should have skill filter toggle", async ({ page }) => {
    const filterButton = page.getByRole("button", {
      name: /Filter by skills/,
    });

    // Filter button only appears if there are candidates with skills
    if (await filterButton.isVisible()) {
      // Click to expand
      await filterButton.click();

      // Should show skill tags container
      await expect(
        page.locator(".flex.flex-wrap.gap-2.p-4.rounded-xl")
      ).toBeVisible();
    } else {
      // No candidates with skills - verify grid still works
      await expect(page.locator('[data-testid="candidates-grid"]')).toBeVisible();
    }
  });

  test("should clear search", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search candidates...");

    // Type something
    await searchInput.fill("Test");

    // Clear button should appear
    const clearButton = page.getByRole("button", { name: "Clear search" });
    await expect(clearButton).toBeVisible();

    // Click clear
    await clearButton.click();

    // Search should be empty
    await expect(searchInput).toHaveValue("");
  });
});
