import { afterEach, describe, expect, mock, test } from "bun:test";

type NewsletterCampaignRecord = {
  id: string;
  newsletterType: string;
  subject: string;
  previewText: string | null;
  contentMode: string;
  markdownContent: string | null;
  manualHtml: string | null;
  manualText: string | null;
  renderedHtml: string | null;
  renderedText?: string | null;
  status: string;
  periodDays: number;
  scheduledAt: Date | null;
  sentAt: Date | null;
  failureReason?: string | null;
  createdBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  archiveSubject?: string | null;
  archivePreviewText?: string | null;
  archiveContentMode?: string | null;
  archiveMarkdownContent?: string | null;
  archiveManualHtml?: string | null;
  archiveManualText?: string | null;
  archiveRenderedHtml?: string | null;
  archiveRenderedText?: string | null;
  archiveCorrectedAt?: Date | null;
  archiveCorrectedBy?: string | null;
};

function makeQueryResult<T>(value: T) {
  return {
    limit: async () => value,
    then: (resolve: (result: T) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
  };
}

async function installNewsletterDbMock(params: {
  selectQueue: unknown[];
  onUpdate?: (values: Record<string, unknown>) => unknown[];
}) {
  const { selectQueue, onUpdate } = params;
  const actualDb = await import("../src/db");

  mock.module("@/db", () => ({
    ...actualDb,
    db: {
      select: () => ({
        from: () => {
          return {
            then: (resolve: (result: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
              Promise.resolve(selectQueue.shift() ?? []).then(resolve, reject),
            where: () => makeQueryResult(selectQueue.shift() ?? []),
            orderBy: () => ({
              limit: async () => selectQueue.shift() ?? [],
            }),
          };
        },
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

describe("newsletter archive corrections", () => {
  afterEach(() => {
    mock.restore();
  });

  test("allows archive-only corrections for sent campaigns while keeping normal sent edits blocked", async () => {
    const actualPosthog = await import("../src/services/posthog");
    mock.module("@/services/posthog", () => ({
      ...actualPosthog,
      getCandidateViewsForWindow: async () => ({ success: true as const, data: [] }),
      getJobApplyClicksForWindow: async () => ({ success: true as const, data: [] }),
      getNewsClicksForWindow: async () => ({ success: true as const, data: [] }),
    }));
    mock.module("@/lib/news", () => ({
      getAllNews: async () => [],
    }));

    const sentCampaign: NewsletterCampaignRecord = {
      id: "camp_sent_1",
      newsletterType: "news",
      subject: "Weekly News Digest",
      previewText: "Original preview",
      contentMode: "manual",
      markdownContent: null,
      manualHtml: "<p>Original archive body</p>",
      manualText: "Original archive body",
      renderedHtml: "<p>Original archive body</p>",
      renderedText: "Original archive body",
      status: "sent",
      periodDays: 7,
      scheduledAt: null,
      sentAt: new Date("2026-03-12T08:00:00.000Z"),
      createdAt: new Date("2026-03-12T07:00:00.000Z"),
      updatedAt: new Date("2026-03-12T08:00:00.000Z"),
    };

    const updateCalls: Array<Record<string, unknown>> = [];
    await installNewsletterDbMock({
      selectQueue: [[sentCampaign], [sentCampaign], []],
      onUpdate: (values) => {
        updateCalls.push(values);
        return [
          {
            ...sentCampaign,
            ...values,
          },
        ];
      },
    });

    const newsletter = await import(
      `../src/services/newsletter?newsletter-archive-corrections-update=${Date.now()}`
    );

    const normalEditResult = await newsletter.updateNewsletterCampaign("camp_sent_1", {
      subject: "Should still fail",
    });

    expect(normalEditResult).toEqual({
      ok: false,
      status: 409,
      error: "Only draft or scheduled campaigns can be modified",
    });

    const archiveCorrectionResult = await newsletter.updateNewsletterCampaign(
      "camp_sent_1",
      {
        subject: "Corrected archive subject",
        previewText: "Corrected archive preview",
        contentMode: "manual",
        manualHtml: "<p>Corrected archive body</p>",
        manualText: "Corrected archive body",
        archiveOnly: true,
        correctedBy: "admin_user",
      } as never,
    );

    expect(archiveCorrectionResult.ok).toBe(true);
    if (!archiveCorrectionResult.ok) {
      throw new Error("expected archive-only correction to succeed");
    }
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toMatchObject({
      archiveSubject: "Corrected archive subject",
      archivePreviewText: "Corrected archive preview",
      archiveContentMode: "manual",
      archiveManualHtml: "<p>Corrected archive body</p>",
      archiveManualText: "Corrected archive body",
      archiveRenderedHtml: "<p>Corrected archive body</p>",
      archiveRenderedText: "Corrected archive body",
      archiveCorrectedBy: "admin_user",
    });
    expect(archiveCorrectionResult.data).toMatchObject({
      id: "camp_sent_1",
      status: "sent",
      subject: "Weekly News Digest",
      archiveSubject: "Corrected archive subject",
      archiveRenderedHtml: "<p>Corrected archive body</p>",
    });
  });

  test("prefers corrected archive fields when reading a sent campaign for the public archive", async () => {
    await installNewsletterDbMock({
      selectQueue: [[{
        id: "camp_sent_1",
        subject: "Original subject",
        previewText: "Original preview",
        newsletterType: "news",
        sentAt: new Date("2026-03-12T08:00:00.000Z"),
        renderedHtml: "<p>Original archive body</p>",
        archiveSubject: "Corrected archive subject",
        archivePreviewText: "Corrected archive preview",
        archiveRenderedHtml: "<p>Corrected archive body</p>",
        archiveCorrectedAt: new Date("2026-03-12T09:30:00.000Z"),
      }]],
    });

    const { getSentNewsletterCampaignForArchive } = await import(
      `../src/services/newsletter?newsletter-archive-corrections-read=${Date.now()}`
    );
    const campaign = await getSentNewsletterCampaignForArchive("camp_sent_1");

    expect(campaign).toEqual({
      id: "camp_sent_1",
      subject: "Corrected archive subject",
      previewText: "Corrected archive preview",
      newsletterType: "news",
      sentAt: new Date("2026-03-12T08:00:00.000Z"),
      renderedHtml: "<p>Corrected archive body</p>",
      archiveCorrectedAt: new Date("2026-03-12T09:30:00.000Z"),
    });
  });
});
