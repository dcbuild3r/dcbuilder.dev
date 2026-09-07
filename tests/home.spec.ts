import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should render hero section with image", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/dcbuilder.eth/);
    const heroImage = page.locator('img[alt="dcbuilder.eth"]');
    await expect(heroImage).toBeVisible();
    await expect(page.locator(".home-gpu-field")).toBeAttached();
    await expect(page.locator("canvas.home-gpu-canvas")).toBeAttached();
  });

  test("publishes installable app metadata and an iOS touch icon", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      "/manifest.webmanifest",
    );
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
      "href",
      /apple-icon\.png/,
    );
  });

  test("should render content sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Research")).toBeVisible();
    await expect(page.getByText("Engineering")).toBeVisible();
    await expect(page.getByText("Angel Investing")).toBeVisible();
  });

  test("mobile navigation covers the page with an opaque surface", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "Open menu" }).click();

    const menu = page.getByRole("dialog", { name: "Navigation menu" });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(menu).toHaveCSS("height", "779px");
    await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
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
