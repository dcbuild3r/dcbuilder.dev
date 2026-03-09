import { describe, expect, test } from "bun:test";
import {
  buildNewsletterTypes,
  isPreferenceRowDirty,
  toPreferenceFlags,
  toSubscriberDraftRow,
} from "../src/lib/newsletter-subscribers";

describe("newsletter subscriber helpers", () => {
  test("maps API preferences into all three newsletter flags", () => {
    expect(
      toPreferenceFlags([
        { newsletterType: "news", enabled: true },
        { newsletterType: "jobs", enabled: false },
      ])
    ).toEqual({
      news: true,
      jobs: false,
      candidates: false,
    });
  });

  test("builds enabled newsletter types from toggle flags", () => {
    expect(buildNewsletterTypes({ news: true, jobs: false, candidates: true })).toEqual(["news", "candidates"]);
  });

  test("detects dirty subscriber preference rows", () => {
    expect(
      isPreferenceRowDirty(
        { news: true, jobs: false, candidates: false },
        { news: true, jobs: false, candidates: false }
      )
    ).toBe(false);
    expect(
      isPreferenceRowDirty(
        { news: true, jobs: false, candidates: false },
        { news: true, jobs: true, candidates: false }
      )
    ).toBe(true);
  });

  test("creates a subscriber row draft with matching current and draft flags", () => {
    expect(
      toSubscriberDraftRow({
        id: "sub_123",
        email: "reader@example.com",
        status: "active",
        createdAt: "2026-03-09T10:00:00.000Z",
        clicks7d: 12,
        lastClickedLink: "https://example.com/story",
        preferences: [
          { newsletterType: "news", enabled: true },
          { newsletterType: "candidates", enabled: true },
        ],
      })
    ).toEqual({
      id: "sub_123",
      email: "reader@example.com",
      status: "active",
      current: {
        news: true,
        jobs: false,
        candidates: true,
      },
      draft: {
        news: true,
        jobs: false,
        candidates: true,
      },
      clicks7d: 12,
      lastClickedLink: "https://example.com/story",
      createdAt: "2026-03-09T10:00:00.000Z",
      saving: false,
      error: null,
    });
  });
});
