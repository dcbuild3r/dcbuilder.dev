import { afterEach, describe, expect, mock, test } from "bun:test";

describe("previewNewsletterCampaignDraft markdown text output", () => {
  afterEach(() => {
    mock.restore();
  });

  test("preserves links in rendered text output", async () => {
    const actualPosthog = await import("../src/services/posthog");
    mock.module("@/db", () => ({
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
    }));
    mock.module("@/services/posthog", () => ({
      ...actualPosthog,
      getCandidateViewsForWindow: async () => ({ success: true as const, data: [] }),
      getJobApplyClicksForWindow: async () => ({ success: true as const, data: [] }),
      getNewsClicksForWindow: async () => ({ success: true as const, data: [] }),
    }));
    mock.module("@/lib/news", () => ({
      getAllNews: async () => [],
    }));

    const { previewNewsletterCampaignDraft } = await import("../src/services/newsletter");
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
