import { describe, expect, test } from "bun:test";

describe("sitemap runtime mode", () => {
  test("forces runtime rendering instead of build-time prerendering", async () => {
    const sitemapModule = await import("../src/app/sitemap");
    const revalidate =
      "revalidate" in sitemapModule
        ? (sitemapModule as { revalidate?: number }).revalidate
        : undefined;

    expect(sitemapModule.dynamic).toBe("force-dynamic");
    expect(revalidate).toBeUndefined();
  });
});
