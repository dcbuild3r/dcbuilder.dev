import { afterEach, describe, expect, mock, test } from "bun:test";
import { createPosthogModuleMock } from "./helpers/posthog-module-mock";

function makeQueryResult<T>(value: T) {
  return {
    limit: async () => value,
    then: (resolve: (value: T) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
  };
}

function makeUpdateResult<T>(awaitValue: T, returningValue: T) {
  return {
    returning: async () => returningValue,
    then: (resolve: (value: T) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(awaitValue).then(resolve, reject),
  };
}

describe("sendDueNewsletterCampaigns", () => {
  afterEach(() => {
    mock.restore();
  });

  test("marks scheduled campaigns with zero recipients as failed", async () => {
    const actualDb = await import("../src/db");
    const selectQueue = [
      [{ id: "camp-1" }],
      [{
        id: "camp-1",
        status: "scheduled",
        scheduledAt: new Date("2026-03-09T10:00:00.000Z"),
        sentAt: null,
        newsletterType: "news",
        contentMode: "template",
        subject: "Weekly digest",
        markdownContent: null,
        manualHtml: null,
        manualText: null,
        periodDays: 7,
      }],
      [],
      [],
    ];
    const updateCalls: Array<Record<string, unknown>> = [];

    mock.module("@/db", () => ({
      ...actualDb,
      db: {
        select: () => ({
          from: () => ({
            where: () => makeQueryResult(selectQueue.shift() ?? []),
          }),
        }),
        update: () => ({
          set: (values: Record<string, unknown>) => ({
            where: () => {
              updateCalls.push(values);
              return makeUpdateResult(
                [],
                values.status === "sending"
                  ? [{
                      id: "camp-1",
                      status: "sending",
                      scheduledAt: new Date("2026-03-09T10:00:00.000Z"),
                      sentAt: null,
                      newsletterType: "news",
                      contentMode: "template",
                      subject: "Weekly digest",
                      markdownContent: null,
                      manualHtml: null,
                      manualText: null,
                      periodDays: 7,
                    }]
                  : [],
              );
            },
          }),
        }),
        insert: () => ({
          values: async () => [],
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
    mock.module("@/services/posthog", () =>
      createPosthogModuleMock({
        getCandidateViewsForWindow: async () => ({ success: true as const, data: [] }),
        getJobApplyClicksForWindow: async () => ({ success: true as const, data: [] }),
        getNewsClicksForWindow: async () => ({ success: true as const, data: [] }),
      })
    );
    mock.module("@/lib/news", () => ({
      getAllNews: async () => [],
    }));

    const { sendDueNewsletterCampaigns } = await import(
      `../src/services/newsletter?newsletter-send-test=${Date.now()}`
    );
    const result = await sendDueNewsletterCampaigns();

    expect(result.ok).toBe(true);
    expect(result.data.processed).toBe(1);
    expect(result.data.results[0]?.result.ok).toBe(false);
    expect(updateCalls[1]?.status).toBe("failed");
    expect(updateCalls[1]?.failureReason).toBe("No active recipients for this campaign type");
  });
});
