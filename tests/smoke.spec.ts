import { test, expect } from "@playwright/test";

test("home page loads and nav is visible", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("link", { name: "dcbuilder.eth" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Jobs" })).toBeVisible();
});

test("jobs page renders filters", async ({ page }) => {
	await page.goto("/jobs");
	await expect(page.getByRole("heading", { name: "Jobs" })).toBeVisible();
	await expect(page.getByLabel("Affiliation:")).toBeVisible();
	await expect(page.getByLabel("Company:")).toBeVisible();
	await expect(page.getByLabel("Location:")).toBeVisible();
	await expect(page.getByPlaceholder("Search jobs...")).toBeVisible();
});

test("candidates modal opens from grid", async ({ page }) => {
	await page.goto("/candidates");
	await expect(page.getByRole("heading", { name: "Candidates" })).toBeVisible();
	const grid = page.locator('[data-testid="candidates-grid"]');
	await expect(grid).toHaveAttribute("data-hydrated", "true");
	const openButtons = page.getByRole("button", { name: "View full profile" });
	await expect(openButtons.first()).toBeVisible();
	await openButtons.first().click();
	await page.waitForFunction(() => document.body.style.overflow === "hidden");
	await expect(page.locator('[role="dialog"]')).toBeVisible();
	await expect(page.locator('button[aria-label="Close profile"]')).toBeVisible();
});
