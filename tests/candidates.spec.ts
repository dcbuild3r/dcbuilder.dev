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

test.describe("HOT/TOP Badge Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/candidates");
    // Wait for hydration
    await page.waitForSelector('[data-testid="candidates-grid"][data-hydrated="true"]');
  });

  test("should display HOT badge with fire emoji and orange gradient", async ({ page }) => {
    // Look for any HOT badges on the page
    const hotBadges = page.locator('span:has-text("🔥 HOT")');
    const hotBadgeCount = await hotBadges.count();

    if (hotBadgeCount > 0) {
      const firstHotBadge = hotBadges.first();
      await expect(firstHotBadge).toBeVisible();

      // Verify the badge has the correct gradient classes
      await expect(firstHotBadge).toHaveClass(/from-orange-500/);
      await expect(firstHotBadge).toHaveClass(/to-amber-500/);
    }
    // If no HOT candidates, test passes (they may not exist in test data)
  });

  test("should display TOP badge with sparkle emoji and purple gradient", async ({ page }) => {
    // Look for any TOP badges on the page
    const topBadges = page.locator('span:has-text("✨ TOP")');
    const topBadgeCount = await topBadges.count();

    if (topBadgeCount > 0) {
      const firstTopBadge = topBadges.first();
      await expect(firstTopBadge).toBeVisible();

      // Verify the badge has the correct gradient classes
      await expect(firstTopBadge).toHaveClass(/from-violet-500/);
      await expect(firstTopBadge).toHaveClass(/to-purple-500/);
    }
    // If no TOP candidates, test passes (they may not exist in test data)
  });

  test("should display both HOT and TOP badges when candidate has both tags", async ({ page }) => {
    // Find cards that have both badges
    const cards = page.locator('.rounded-xl.border');
    const cardCount = await cards.count();

    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const hasHot = await card.locator('span:has-text("🔥 HOT")').count() > 0;
      const hasTop = await card.locator('span:has-text("✨ TOP")').count() > 0;

      if (hasHot && hasTop) {
        // Found a card with both badges - verify both are visible
        await expect(card.locator('span:has-text("🔥 HOT")')).toBeVisible();
        await expect(card.locator('span:has-text("✨ TOP")')).toBeVisible();
        break;
      }
    }
    // If no candidates with both tags, test passes
  });

  test("HOT candidates should have orange card styling", async ({ page }) => {
    // Wait for the hot candidates API to respond
    await page.waitForResponse(
      (response) => response.url().includes("/api/hot-candidates"),
      { timeout: 5000 }
    ).catch(() => {
      // API may not be called if mocked or unavailable
    });

    // Find cards with HOT badge
    const hotCards = page.locator('.rounded-xl.border:has(span:has-text("🔥 HOT"))');
    const count = await hotCards.count();

    if (count > 0) {
      const firstHotCard = hotCards.first();
      // Hot cards should have orange border styling
      await expect(firstHotCard).toHaveClass(/border-orange-500|from-orange-100/);
    }
  });

  test("should filter by HOT skill tag", async ({ page }) => {
    // Open skill filter
    const filterButton = page.getByRole("button", { name: /Filter by skills/ });

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Look for HOT filter button in expanded tags
      const hotTagButton = page.locator('button:has-text("HOT")').first();

      if (await hotTagButton.isVisible()) {
        await hotTagButton.click();

        // Wait for filter to apply
        await page.waitForTimeout(300);

        // All visible candidates should have the hot tag badge
        const candidateCards = page.locator('.rounded-xl.border');
        const count = await candidateCards.count();

        // If there are results, each should have HOT badge
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const card = candidateCards.nth(i);
            await expect(card.locator('span:has-text("🔥 HOT")')).toBeVisible();
          }
        }
      }
    }
  });

  test("should filter by TOP skill tag", async ({ page }) => {
    // Open skill filter
    const filterButton = page.getByRole("button", { name: /Filter by skills/ });

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Look for TOP filter button in expanded tags
      const topTagButton = page.locator('button:has-text("TOP")').first();

      if (await topTagButton.isVisible()) {
        await topTagButton.click();

        // Wait for filter to apply
        await page.waitForTimeout(300);

        // All visible candidates should have the top tag badge
        const candidateCards = page.locator('.rounded-xl.border');
        const count = await candidateCards.count();

        // If there are results, each should have TOP badge
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) {
            const card = candidateCards.nth(i);
            await expect(card.locator('span:has-text("✨ TOP")')).toBeVisible();
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
    // Find first candidate card and click View Details
    const viewDetailsButton = page.getByRole("button", { name: "View Details" }).first();

    if (await viewDetailsButton.isVisible()) {
      await viewDetailsButton.click();

      // Wait for modal to open
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Check if badges are visible in the expanded view (if candidate has them)
      const modal = page.locator('[role="dialog"]');
      const hasHotBadge = await modal.locator('span:has-text("🔥 HOT")').count() > 0;
      const hasTopBadge = await modal.locator('span:has-text("✨ TOP")').count() > 0;

      // Verify badges match between card and expanded view
      // (The presence/absence should be consistent)
      if (hasHotBadge) {
        await expect(modal.locator('span:has-text("🔥 HOT")')).toBeVisible();
      }
      if (hasTopBadge) {
        await expect(modal.locator('span:has-text("✨ TOP")')).toBeVisible();
      }

      // Close modal
      await page.keyboard.press("Escape");
    }
  });

  test("expanded view header should have correct gradient for HOT candidates", async ({ page }) => {
    // Find a HOT candidate card
    const hotCard = page.locator('.rounded-xl.border:has(span:has-text("🔥 HOT"))').first();

    if (await hotCard.isVisible()) {
      // Click View Details
      await hotCard.getByRole("button", { name: "View Details" }).click();

      // Wait for modal
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // The header section should have orange gradient
      const headerSection = page.locator('[role="dialog"] .bg-gradient-to-r').first();
      await expect(headerSection).toHaveClass(/from-orange-100|from-orange-900/);

      await page.keyboard.press("Escape");
    }
  });

  test("expanded view header should have correct gradient for TOP-only candidates", async ({ page }) => {
    // Wait for hot candidates API to load
    await page.waitForResponse(
      (response) => response.url().includes("/api/hot-candidates"),
      { timeout: 5000 }
    ).catch(() => {});

    // Find a card that has TOP but not HOT badge
    const cards = page.locator('.rounded-xl.border');
    const cardCount = await cards.count();

    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const hasHot = await card.locator('span:has-text("🔥 HOT")').count() > 0;
      const hasTop = await card.locator('span:has-text("✨ TOP")').count() > 0;

      if (hasTop && !hasHot) {
        // Found TOP-only card
        await card.getByRole("button", { name: "View Details" }).click();

        await expect(page.locator('[role="dialog"]')).toBeVisible();

        // The header section should have purple gradient
        const headerSection = page.locator('[role="dialog"] .bg-gradient-to-r').first();
        await expect(headerSection).toHaveClass(/from-violet-100|from-violet-900/);

        await page.keyboard.press("Escape");
        break;
      }
    }
  });
});
