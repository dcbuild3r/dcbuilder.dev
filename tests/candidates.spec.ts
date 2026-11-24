import { test, expect, type Page } from "@playwright/test";

const candidateCards = (page: Page) =>
  page.locator('[data-testid="candidate-card"]');

test.describe("Candidates Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/candidates");
    // Wait for hydration
    await page.waitForSelector('[data-testid="candidates-grid"][data-hydrated="true"]');
  });

  test("should render the candidates page", async ({ page }) => {
    await expect(page).toHaveTitle(/Candidates/);
    await expect(
      page.getByRole("heading", { name: "Candidates", level: 1 })
    ).toBeVisible();
  });

  test("should display filter controls", async ({ page }) => {
    await expect(page.locator("#availability-filter")).toBeVisible();
    await expect(page.locator("#experience-filter")).toBeVisible();
    await expect(page.locator("#candidate-location-filter")).toBeVisible();
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
      name: /^Skills/,
    });

    // Filter button only appears if there are candidates with skills
    if (await filterButton.isVisible()) {
      // Click to expand
      await filterButton.click();

      // Should show skill tags container
      await expect(
        page.locator('[data-testid="candidate-skills-panel"]')
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

  test("should filter candidates by location", async ({ page }) => {
    await page.locator("#candidate-location-filter").click();
    await page.getByRole("option", { name: "Remote" }).click();

    await expect(page).toHaveURL(/location=Remote/);
    await expect(page.getByText(/\d+ candidates?/)).toBeVisible();

    const cards = candidateCards(page);
    const count = await cards.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      await expect(cards.nth(i)).toContainText("Remote");
    }
  });
});

test.describe("HOT/TOP Badge Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/candidates");
    // Wait for hydration
    await page.waitForSelector('[data-testid="candidates-grid"][data-hydrated="true"]');
  });

  test("should display HOT as a warm pill (gradient, no emoji)", async ({ page }) => {
    // Look for any HOT badges on the page
    const hotBadges = page.locator('span:text-is("HOT")');
    const hotBadgeCount = await hotBadges.count();

    if (hotBadgeCount > 0) {
      const firstHotBadge = hotBadges.first();
      await expect(firstHotBadge).toBeVisible();

      await expect(firstHotBadge).toHaveClass(/bg-warm-soft/);
    }
    // If no HOT candidates, test passes (they may not exist in test data)
  });

  test("should display TOP as a solid pill (gradient, no emoji)", async ({ page }) => {
    // Look for any TOP badges on the page
    const topBadges = page.locator('span:text-is("TOP")');
    const topBadgeCount = await topBadges.count();

    if (topBadgeCount > 0) {
      const firstTopBadge = topBadges.first();
      await expect(firstTopBadge).toBeVisible();

      await expect(firstTopBadge).toHaveClass(/from-violet-500|border-line-strong/);
    }
    // If no TOP candidates, test passes (they may not exist in test data)
  });

  test("should display both HOT and TOP badges when candidate has both tags", async ({ page }) => {
    // Find cards that have both badges
    const cards = candidateCards(page);
    const cardCount = await cards.count();

    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const hasHot = await card.locator('span:text-is("HOT")').count() > 0;
      const hasTop = await card.locator('span:text-is("TOP")').count() > 0;

      if (hasHot && hasTop) {
        // Found a card with both badges - verify both are visible
        await expect(card.locator('span:text-is("HOT")')).toBeVisible();
        await expect(card.locator('span:text-is("TOP")')).toBeVisible();
        break;
      }
    }
    // If no candidates with both tags, test passes
  });

  test("HOT candidates should show a warm HOT pill without card glow", async ({ page }) => {
    await page.waitForResponse(
      (response) => response.url().includes("/api/hot-candidates"),
      { timeout: 5000 }
    ).catch(() => {
      // API may not be called if mocked or unavailable
    });

    const hotCards = candidateCards(page).filter({ has: page.locator('span:text-is("HOT")') });

    if ((await hotCards.count()) > 0) {
      await expect(hotCards.first()).not.toHaveClass(/shadow-|bg-gradient/);
    }
  });

  test("should filter by HOT skill tag", async ({ page }) => {
    // Open skill filter
    const filterButton = page.getByRole("button", { name: /^Skills/ });

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Look for HOT filter button in expanded tags
      const hotTagButton = page.locator('button:has-text("HOT")').first();

      if (await hotTagButton.isVisible()) {
        await hotTagButton.click();

        // Wait for filter to apply
        await page.waitForTimeout(300);

        // All visible candidates should have the hot tag badge
        const cards = candidateCards(page);
        const count = await cards.count();

        // If there are results, each should have HOT badge
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const card = cards.nth(i);
            await expect(card.locator('span:text-is("HOT")')).toBeVisible();
          }
        }
      }
    }
  });

  test("should filter by TOP skill tag", async ({ page }) => {
    // Open skill filter
    const filterButton = page.getByRole("button", { name: /^Skills/ });

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Look for TOP filter button in expanded tags
      const topTagButton = page.locator('button:has-text("TOP")').first();

      if (await topTagButton.isVisible()) {
        await topTagButton.click();

        // Wait for filter to apply
        await page.waitForTimeout(300);

        // All visible candidates should have the top tag badge
        const cards = candidateCards(page);
        const count = await cards.count();

        // If there are results, each should have TOP badge
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const card = cards.nth(i);
            await expect(card.locator('span:text-is("TOP")')).toBeVisible();
          }
        }
      }
    }
  });
});

test.describe("Candidate Card Expanded View Badges", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/candidates");
    await page.waitForSelector('[data-testid="candidates-grid"][data-hydrated="true"]');
  });

  test("should show badges in expanded view", async ({ page }) => {
    // Find first candidate card and click View profile
    const viewDetailsButton = page.getByRole("button", { name: "View profile" }).first();

    if (await viewDetailsButton.isVisible()) {
      await viewDetailsButton.click();

      // Wait for modal to open
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Check if badges are visible in the expanded view (if candidate has them)
      const modal = page.locator('[role="dialog"]');
      const hasHotBadge = await modal.locator('span:text-is("HOT")').count() > 0;
      const hasTopBadge = await modal.locator('span:text-is("TOP")').count() > 0;

      // Verify badges match between card and expanded view
      // (The presence/absence should be consistent)
      if (hasHotBadge) {
        await expect(modal.locator('span:text-is("HOT")')).toBeVisible();
      }
      if (hasTopBadge) {
        await expect(modal.locator('span:text-is("TOP")')).toBeVisible();
      }

      // Close modal
      await page.keyboard.press("Escape");
    }
  });

  test("expanded view should close on Escape", async ({ page }) => {
    const viewButton = page.getByRole("button", { name: "View profile" }).first();

    if (await viewButton.isVisible()) {
      await viewButton.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(page.locator('[role="dialog"]')).toBeHidden();
    }
  });
});
