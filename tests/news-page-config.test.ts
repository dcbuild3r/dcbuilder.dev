import { describe, expect, test } from "bun:test";

describe("news page data loading", () => {
  test("includes company timeline news so search can find portfolio company posts", async () => {
    const source = await Bun.file("src/app/news/page.tsx").text();

    expect(source).toContain("getAllNews({ includeCompanyTimelineNews: true })");
  });
});
