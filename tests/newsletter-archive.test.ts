import { afterEach, describe, expect, mock, test } from "bun:test";

describe("public newsletter archive loaders", () => {
  afterEach(() => {
    mock.restore();
  });

  test("returns an unavailable archive state when listing campaigns throws", async () => {
    const originalConsoleError = console.error;
    console.error = (() => {}) as typeof console.error;
    mock.module("@/services/newsletter", () => ({
      listSentNewsletterCampaigns: async () => {
        throw new Error('relation "newsletter_campaigns" does not exist');
      },
      getSentNewsletterCampaignForArchive: async () => null,
      findSentNewsletterCampaignForArchive: async () => ({ campaign: null, matchedByLegacyId: false }),
    }));

    const { loadPublicNewsletterArchive } = await import(
      `../src/lib/newsletter-archive?newsletter-archive-list=${Date.now()}`
    );
    const result = await loadPublicNewsletterArchive(4);

    expect(result).toEqual({
      available: false,
      campaigns: [],
    });

    console.error = originalConsoleError;
  });

  test("returns an unavailable campaign state when reading a campaign throws", async () => {
    const originalConsoleError = console.error;
    console.error = (() => {}) as typeof console.error;
    mock.module("@/services/newsletter", () => ({
      listSentNewsletterCampaigns: async () => [],
      getSentNewsletterCampaignForArchive: async () => null,
      findSentNewsletterCampaignForArchive: async () => {
        throw new Error('relation "newsletter_campaigns" does not exist');
      },
    }));

    const { loadPublicNewsletterCampaign } = await import(
      `../src/lib/newsletter-archive?newsletter-archive-campaign=${Date.now()}`
    );
    const result = await loadPublicNewsletterCampaign("camp_123");

    expect(result).toEqual({
      available: false,
      campaign: null,
      redirectTo: null,
    });

    console.error = originalConsoleError;
  });

  test("passes through sent campaigns when the archive query succeeds", async () => {
    const campaigns = [
      {
        id: "camp_123",
        publicSlug: "weekly-news-digest-2026-03-11",
        subject: "Weekly News Digest",
        previewText: "Top updates",
        newsletterType: "news",
        sentAt: new Date("2026-03-11T08:00:00.000Z"),
      },
    ];

    mock.module("@/services/newsletter", () => ({
      listSentNewsletterCampaigns: async () => campaigns,
      getSentNewsletterCampaignForArchive: async () => campaigns[0],
      findSentNewsletterCampaignForArchive: async (identifier: string) => ({
        campaign: campaigns[0],
        matchedByLegacyId: identifier === campaigns[0].id,
      }),
    }));

    const { loadPublicNewsletterArchive, loadPublicNewsletterCampaign } = await import(
      `../src/lib/newsletter-archive?newsletter-archive-success=${Date.now()}`
    );

    await expect(loadPublicNewsletterArchive(1)).resolves.toEqual({
      available: true,
      campaigns,
    });
    await expect(loadPublicNewsletterCampaign(campaigns[0].publicSlug)).resolves.toEqual({
      available: true,
      campaign: campaigns[0],
      redirectTo: null,
    });
    await expect(loadPublicNewsletterCampaign("camp_123")).resolves.toEqual({
      available: true,
      campaign: campaigns[0],
      redirectTo: `/newsletters/${campaigns[0].publicSlug}`,
    });
  });
});
