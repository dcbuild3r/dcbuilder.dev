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
      getSentNewsletterCampaignForArchive: async () => {
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
    });

    console.error = originalConsoleError;
  });

  test("passes through sent campaigns when the archive query succeeds", async () => {
    const campaigns = [
      {
        id: "camp_123",
        subject: "Weekly News Digest",
        previewText: "Top updates",
        newsletterType: "news",
        sentAt: new Date("2026-03-11T08:00:00.000Z"),
      },
    ];

    mock.module("@/services/newsletter", () => ({
      listSentNewsletterCampaigns: async () => campaigns,
      getSentNewsletterCampaignForArchive: async () => campaigns[0],
    }));

    const { loadPublicNewsletterArchive, loadPublicNewsletterCampaign } = await import(
      `../src/lib/newsletter-archive?newsletter-archive-success=${Date.now()}`
    );

    await expect(loadPublicNewsletterArchive(1)).resolves.toEqual({
      available: true,
      campaigns,
    });
    await expect(loadPublicNewsletterCampaign("camp_123")).resolves.toEqual({
      available: true,
      campaign: campaigns[0],
    });
  });
});
