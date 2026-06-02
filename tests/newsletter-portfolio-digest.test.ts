import { afterEach, describe, expect, mock, test } from "bun:test";
import { createPosthogModuleMock } from "./helpers/posthog-module-mock";

describe("portfolio newsletter digest", () => {
  afterEach(() => {
    mock.restore();
  });

  test("renders only portfolio company news for portfolio campaigns", async () => {
    const actualDb = await import("../src/db");
    const portfolioItem = {
      id: "portfolio-monad",
      type: "announcement" as const,
      title: "Monad launches testnet",
      url: "https://example.com/monad-testnet",
      date: new Date().toISOString().slice(0, 10),
      postedAt: new Date().toISOString(),
      description: "A portfolio company update",
      category: "product" as const,
      relevance: 8,
      company: "Monad",
      platform: "blog",
      portfolioCompany: {
        title: "Monad",
        logo: null,
        website: "https://monad.xyz",
        jobsUrl: "/jobs?company=Monad",
        jobCount: 0,
      },
    };
    const generalItem = {
      id: "general-story",
      type: "curated" as const,
      title: "Ethereum roadmap update",
      url: "https://example.com/ethereum",
      date: new Date().toISOString().slice(0, 10),
      postedAt: new Date().toISOString(),
      description: "A general news update",
      category: "research" as const,
      relevance: 10,
      source: "Ethereum Foundation",
    };

    mock.module("@/db", () => ({
      ...actualDb,
      db: {
        select: () => ({
          from: () => Promise.resolve([]),
        }),
      },
    }));
    mock.module("@/services/posthog", () =>
      createPosthogModuleMock({
        getCandidateViewsForWindow: async () => ({ success: true as const, data: [] }),
        getJobApplyClicksForWindow: async () => ({ success: true as const, data: [] }),
        getNewsClicksForWindow: async () => ({
          success: true as const,
          data: [{ id: portfolioItem.id, count: 4 }],
        }),
      })
    );
    mock.module("@/lib/news", () => ({
      getAllNews: async () => [portfolioItem, generalItem],
      isCompanyTimelineNewsItem: (item: { portfolioCompany?: unknown }) => Boolean(item.portfolioCompany),
    }));

    const { previewNewsletterCampaignDraft } = await import(
      `../src/services/newsletter?newsletter-portfolio-digest=${Date.now()}`
    );

    const result = await previewNewsletterCampaignDraft({
      newsletterType: "portfolio",
      subject: "Portfolio News Digest",
      timeframePreset: "weekly",
      minimumRelevance: 1,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected portfolio preview");
    expect(result.data.context.digest.heading).toBe("Portfolio news digest");
    expect(result.data.context.digest.items.map((item: { title: string }) => item.title)).toEqual([
      "Monad launches testnet",
    ]);
    expect(result.data.rendered.text).toContain("Monad launches testnet");
    expect(result.data.rendered.text).not.toContain("Ethereum roadmap update");
  });
});
