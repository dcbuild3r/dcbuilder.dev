import { describe, expect, test } from "bun:test";
import {
  buildNewsletterPublicSlug,
  deriveNewsletterSlugDateAnchor,
  ensureUniqueNewsletterPublicSlug,
} from "../src/lib/newsletter-slug";

describe("newsletter public slug helpers", () => {
  test("builds a slug from subject and UTC publish date", () => {
    expect(
      buildNewsletterPublicSlug(
        "Weekly News Digest",
        new Date("2026-02-27T22:43:41.179Z"),
      ),
    ).toBe("weekly-news-digest-2026-02-27");
  });

  test("normalizes punctuation and collapses separators", () => {
    expect(
      buildNewsletterPublicSlug(
        "  AI & Crypto: Weekly / Digest!!!  ",
        new Date("2026-02-27T22:43:41.179Z"),
      ),
    ).toBe("ai-crypto-weekly-digest-2026-02-27");
  });

  test("uses sentAt as the publish date anchor when available", () => {
    expect(
      deriveNewsletterSlugDateAnchor({
        sentAt: new Date("2026-02-27T22:43:41.179Z"),
        scheduledAt: new Date("2026-02-28T08:00:00.000Z"),
        createdAt: new Date("2026-02-26T18:00:00.000Z"),
      }).toISOString(),
    ).toBe("2026-02-27T22:43:41.179Z");
  });

  test("falls back to scheduledAt and then createdAt", () => {
    expect(
      deriveNewsletterSlugDateAnchor({
        scheduledAt: new Date("2026-03-01T08:00:00.000Z"),
        createdAt: new Date("2026-02-26T18:00:00.000Z"),
      }).toISOString(),
    ).toBe("2026-03-01T08:00:00.000Z");

    expect(
      deriveNewsletterSlugDateAnchor({
        createdAt: new Date("2026-02-26T18:00:00.000Z"),
      }).toISOString(),
    ).toBe("2026-02-26T18:00:00.000Z");
  });

  test("appends numeric suffixes when the base slug already exists", () => {
    expect(
      ensureUniqueNewsletterPublicSlug("weekly-news-digest-2026-02-27", []),
    ).toBe("weekly-news-digest-2026-02-27");

    expect(
      ensureUniqueNewsletterPublicSlug("weekly-news-digest-2026-02-27", [
        "weekly-news-digest-2026-02-27",
      ]),
    ).toBe("weekly-news-digest-2026-02-27-2");

    expect(
      ensureUniqueNewsletterPublicSlug("weekly-news-digest-2026-02-27", [
        "weekly-news-digest-2026-02-27",
        "weekly-news-digest-2026-02-27-2",
        "weekly-news-digest-2026-02-27-3",
      ]),
    ).toBe("weekly-news-digest-2026-02-27-4");
  });
});
