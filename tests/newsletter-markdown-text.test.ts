import { afterEach, describe, expect, mock, test } from "bun:test";

function makeDbMock() {
  return {
    db: {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
          then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) =>
            Promise.resolve([]).then(resolve, reject),
        }),
      }),
    },
    jobs: {},
    candidates: {},
    newsletterTemplates: {},
    newsletterSubscribers: {},
    newsletterPreferences: {},
    newsletterCampaigns: {},
    newsletterCampaignRecipients: {},
    newsletterSendEvents: {},
    newsletterUnsubTokens: {},
  };
}

describe("previewNewsletterCampaignDraft markdown text output", () => {
  afterEach(() => {
    mock.restore();
  });

  test("groups starter markdown by category with section separators", async () => {
    mock.module("@/db", () => makeDbMock());
    mock.module("@/services/posthog", () => ({
      getCandidateViewsForWindow: async () => ({ success: true as const, data: [] }),
      getJobApplyClicksForWindow: async () => ({ success: true as const, data: [] }),
      getNewsClicksForWindow: async () => ({ success: true as const, data: [] }),
    }));
    mock.module("@/lib/news", () => ({
      getAllNews: async () => ([
        {
          id: "ai-story",
          type: "curated",
          title: "AI story",
          url: "https://example.com/ai",
          date: "2026-04-08",
          category: "ai",
          source: "Example AI",
        },
        {
          id: "crypto-story",
          type: "curated",
          title: "Crypto story",
          url: "https://example.com/crypto",
          date: "2026-04-07",
          category: "crypto",
          source: "Example Crypto",
        },
        {
          id: "research-story",
          type: "curated",
          title: "Research story",
          url: "https://example.com/research",
          date: "2026-04-06",
          category: "research",
          source: "Example Research",
        },
      ]),
    }));

    const { previewNewsletterCampaignDraft } = await import(
      `../src/services/newsletter?newsletter-markdown-groups=${Date.now()}`
    );
    const result = await previewNewsletterCampaignDraft({
      newsletterType: "news",
      subject: "Weekly digest",
      contentMode: "template",
      periodDays: 7,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected preview result");

    expect(result.data.starter.markdown).toContain("## AI");
    expect(result.data.starter.markdown).toContain("## Crypto");
    expect(result.data.starter.markdown).toContain("## Research");
    expect(result.data.starter.markdown).toContain("---\n\n## Crypto");
    expect(result.data.starter.markdown).toContain("- **AI story**");
    expect(result.data.starter.markdown).not.toContain("### Recent News");
  });

  test("preserves links in rendered text output", async () => {
    mock.module("@/db", () => makeDbMock());
    mock.module("@/services/posthog", () => ({
      getCandidateViewsForWindow: async () => ({ success: true as const, data: [] }),
      getJobApplyClicksForWindow: async () => ({ success: true as const, data: [] }),
      getNewsClicksForWindow: async () => ({ success: true as const, data: [] }),
    }));
    mock.module("@/lib/news", () => ({
      getAllNews: async () => [],
    }));

    const { previewNewsletterCampaignDraft } = await import(
      `../src/services/newsletter?newsletter-markdown-links=${Date.now()}`
    );
    const result = await previewNewsletterCampaignDraft({
      newsletterType: "news",
      subject: "Weekly digest",
      contentMode: "markdown",
      markdownContent: [
        "## Weekly digest",
        "",
        "Read [Example](https://example.com).",
        "",
        "[Manage preferences]({{preferences_url}}) | [Unsubscribe]({{unsubscribe_url}})",
      ].join("\n"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected preview result");

    expect(result.data.rendered.text).toContain("https://example.com");
    expect(result.data.rendered.text).toContain("https://dcbuilder.dev/api/v1/newsletter/preferences?token=preview-token");
    expect(result.data.rendered.text).toContain("https://dcbuilder.dev/api/v1/newsletter/unsubscribe?token=preview-token");
  });
});
