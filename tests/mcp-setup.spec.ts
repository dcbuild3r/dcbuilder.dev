import { test, expect } from "@playwright/test";

test("MCP setup opens beside the theme control and copies the public URL", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Set up MCP" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Connect your AI" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("read only");
  await dialog.getByRole("button", { name: "Copy mcp url" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://mcp.dcbuilder.dev/mcp");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("MCP setup is available in the mobile navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Set up MCP" }).last().click();
  await expect(page.getByRole("dialog", { name: "Connect your AI" })).toBeVisible();
});
