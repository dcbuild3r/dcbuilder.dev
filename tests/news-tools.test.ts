import { describe, expect, test } from "bun:test";
import { getNewsToolsRecommendationSummary } from "../src/lib/news-tools";

describe("getNewsToolsRecommendationSummary", () => {
  test("prioritizes The MEV Letter in the compact highlights", () => {
    const summary = getNewsToolsRecommendationSummary();

    expect(summary.highlights).toHaveLength(4);
    expect(summary.highlights[0]?.name).toBe("The MEV Letter");
    expect(summary.hiddenCount).toBeGreaterThan(0);
  });
});
