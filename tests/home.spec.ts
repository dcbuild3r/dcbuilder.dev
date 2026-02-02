import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should render hero section with image", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/dcbuilder.eth/);
    const heroImage = page.locator('img[alt="dcbuilder.eth"]');
    await expect(heroImage).toBeVisible();
  });

  test("should render content sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Research")).toBeVisible();
    await expect(page.getByText("Engineering")).toBeVisible();
    await expect(page.getByText("Angel Investing")).toBeVisible();
  });

  test("should render investment container", async ({ page }) => {
    await page.goto("/portfolio");
    // Check for the main container or controls which should always be present
    await expect(page.getByText("Sort by:")).toBeVisible();
    await expect(page.getByRole("button", { name: /Main/ })).toBeVisible();
  });

  test("should render list items", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Ethereum")).toBeVisible();
    await expect(page.getByText("Rust")).toBeVisible();
    await expect(page.getByText("Solidity")).toBeVisible();
  });

  test("should navigate to portfolio", async ({ page }) => {
    // Force desktop viewport to ensure menu is visible
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.getByRole("link", { name: "Portfolio" }).first().click();
    await expect(page).toHaveURL(/.*\/portfolio/);
  });
});
