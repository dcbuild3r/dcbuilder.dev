import { afterEach, describe, expect, mock, test } from "bun:test";

type DbMockOptions = {
  selectQueue?: unknown[];
  onInsert?: (values: Record<string, unknown> | Array<Record<string, unknown>>) => unknown[];
  onUpdate?: (values: Record<string, unknown>) => unknown[];
};

function makeQueryResult<T>(value: T) {
  return {
    limit: async () => value,
    orderBy: () => ({
      limit: async () => value,
    }),
    then: (resolve: (result: T) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
  };
}

async function installNewsletterDbMock({
  selectQueue = [],
  onInsert,
  onUpdate,
}: DbMockOptions) {
  const actualDb = await import("../src/db");

  mock.module("@/db", () => ({
    ...actualDb,
    db: {
      select: () => ({
        from: () => ({
          then: (resolve: (result: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
            Promise.resolve(selectQueue.shift() ?? []).then(resolve, reject),
          where: () => makeQueryResult(selectQueue.shift() ?? []),
          orderBy: () => ({
            limit: async () => selectQueue.shift() ?? [],
          }),
          limit: async () => selectQueue.shift() ?? [],
        }),
      }),
      insert: () => ({
        values: (values: Record<string, unknown> | Array<Record<string, unknown>>) => ({
          returning: async () => onInsert?.(values) ?? [],
        }),
      }),
      update: () => ({
        set: (values: Record<string, unknown>) => ({
          where: () => ({
            returning: async () => onUpdate?.(values) ?? [],
          }),
        }),
      }),
    },
  }));
}

describe("newsletter public slug services", () => {
  afterEach(() => {
    mock.restore();
  });

  test("stores a derived public slug when creating a scheduled campaign", async () => {
    const insertCalls: Array<Record<string, unknown>> = [];
    await installNewsletterDbMock({
      onInsert: (values) => {
        const record = values as Record<string, unknown>;
        insertCalls.push(record);
        return [record];
      },
    });

    const newsletter = await import(
      `../src/services/newsletter?newsletter-public-slug-create=${Date.now()}`
    );
    const result = await newsletter.createNewsletterCampaign({
      newsletterType: "news",
      subject: "Weekly News Digest",
      previewText: "Top updates",
      scheduledAt: "2026-03-18T12:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]).toMatchObject({
      subject: "Weekly News Digest",
      status: "scheduled",
      publicSlug: "weekly-news-digest-2026-03-18",
    });
  });

  test("recomputes the public slug when a mutable campaign title or schedule changes", async () => {
    const updateCalls: Array<Record<string, unknown>> = [];
    await installNewsletterDbMock({
      selectQueue: [[{
        id: "camp_draft_1",
        publicSlug: "weekly-news-digest-2026-03-11",
        newsletterType: "news",
        subject: "Weekly News Digest",
        previewText: "Top updates",
        contentMode: "template",
        markdownContent: null,
        manualHtml: null,
        manualText: null,
        status: "scheduled",
        periodDays: 7,
        scheduledAt: new Date("2026-03-11T08:00:00.000Z"),
        sentAt: null,
        failureReason: null,
        createdBy: "admin_user",
        createdAt: new Date("2026-03-10T18:30:00.000Z"),
        updatedAt: new Date("2026-03-10T18:30:00.000Z"),
      }]],
      onUpdate: (values) => {
        updateCalls.push(values);
        return [{
          id: "camp_draft_1",
          ...values,
        }];
      },
    });

    const newsletter = await import(
      `../src/services/newsletter?newsletter-public-slug-update=${Date.now()}`
    );
    const result = await newsletter.updateNewsletterCampaign("camp_draft_1", {
      subject: "Weekly Market Digest",
      scheduledAt: "2026-03-18T12:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toMatchObject({
      subject: "Weekly Market Digest",
      status: "scheduled",
      publicSlug: "weekly-market-digest-2026-03-18",
    });
  });

  test("includes public slugs in sent archive summaries", async () => {
    await installNewsletterDbMock({
      selectQueue: [[{
        id: "camp_sent_1",
        publicSlug: "weekly-news-digest-2026-03-11",
        subject: "Original subject",
        previewText: "Original preview",
        newsletterType: "news",
        sentAt: new Date("2026-03-11T08:00:00.000Z"),
        archiveSubject: "Corrected archive subject",
        archivePreviewText: "Corrected archive preview",
        archiveCorrectedAt: new Date("2026-03-11T09:00:00.000Z"),
      }]],
    });

    const { listSentNewsletterCampaigns } = await import(
      `../src/services/newsletter?newsletter-public-slug-list=${Date.now()}`
    );
    const campaigns = await listSentNewsletterCampaigns(10);

    expect(campaigns).toEqual([{
      id: "camp_sent_1",
      publicSlug: "weekly-news-digest-2026-03-11",
      subject: "Corrected archive subject",
      previewText: "Corrected archive preview",
      newsletterType: "news",
      sentAt: new Date("2026-03-11T08:00:00.000Z"),
      archiveCorrectedAt: new Date("2026-03-11T09:00:00.000Z"),
    }]);
  });

  test("finds sent archive campaigns by slug first and falls back to legacy ids", async () => {
    await installNewsletterDbMock({
      selectQueue: [
        [{
          id: "camp_sent_1",
          publicSlug: "weekly-news-digest-2026-03-11",
          subject: "Weekly News Digest",
          previewText: "Top updates",
          newsletterType: "news",
          sentAt: new Date("2026-03-11T08:00:00.000Z"),
          renderedHtml: "<p>Body</p>",
          archiveSubject: null,
          archivePreviewText: null,
          archiveRenderedHtml: null,
          archiveCorrectedAt: null,
        }],
        [],
        [{
          id: "camp_sent_1",
          publicSlug: "weekly-news-digest-2026-03-11",
          subject: "Weekly News Digest",
          previewText: "Top updates",
          newsletterType: "news",
          sentAt: new Date("2026-03-11T08:00:00.000Z"),
          renderedHtml: "<p>Body</p>",
          archiveSubject: null,
          archivePreviewText: null,
          archiveRenderedHtml: null,
          archiveCorrectedAt: null,
        }],
      ],
    });

    const { findSentNewsletterCampaignForArchive } = await import(
      `../src/services/newsletter?newsletter-public-slug-find=${Date.now()}`
    );

    await expect(
      findSentNewsletterCampaignForArchive("weekly-news-digest-2026-03-11")
    ).resolves.toEqual({
      campaign: {
        id: "camp_sent_1",
        publicSlug: "weekly-news-digest-2026-03-11",
        subject: "Weekly News Digest",
        previewText: "Top updates",
        newsletterType: "news",
        sentAt: new Date("2026-03-11T08:00:00.000Z"),
        renderedHtml: "<p>Body</p>",
        archiveCorrectedAt: null,
      },
      matchedByLegacyId: false,
    });

    await expect(findSentNewsletterCampaignForArchive("camp_sent_1")).resolves.toEqual({
      campaign: {
        id: "camp_sent_1",
        publicSlug: "weekly-news-digest-2026-03-11",
        subject: "Weekly News Digest",
        previewText: "Top updates",
        newsletterType: "news",
        sentAt: new Date("2026-03-11T08:00:00.000Z"),
        renderedHtml: "<p>Body</p>",
        archiveCorrectedAt: null,
      },
      matchedByLegacyId: true,
    });
  });
});
