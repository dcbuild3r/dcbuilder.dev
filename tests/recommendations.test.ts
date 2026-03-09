import { describe, expect, test } from "bun:test";
import { getRecommendedLinks } from "../src/lib/recommendations";

describe("getRecommendedLinks", () => {
  test("includes The MEV Letter in the shared recommended links", () => {
    const links = getRecommendedLinks();

    expect(links).toContainEqual({
      name: "The MEV Letter",
      url: "https://collective.flashbots.net/tag/the-mev-letter",
      description: "Flashbots' MEV research roundup covering papers, posts, and ecosystem updates",
    });
  });

  test("can include newsletter-only extras", () => {
    const links = getRecommendedLinks({ includeNewsletterExtras: true });

    expect(links).toContainEqual({
      name: "dcbuilder.dev/news",
      url: "https://dcbuilder.dev/news",
      description: "Older curated links and announcements",
    });
  });
});
