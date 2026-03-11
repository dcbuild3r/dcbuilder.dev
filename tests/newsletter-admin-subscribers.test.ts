import { afterEach, describe, expect, mock, test } from "bun:test";

function makeQueryResult<T>(value: T) {
  return {
    limit: async () => value,
    then: (resolve: (value: T) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
  };
}

function makeAwaitable<T>(value: T) {
  return {
    then: (resolve: (value: T) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
  };
}

type MockSubscriberStatus = "pending" | "active" | "unsubscribed";
type MockNewsletterType = "news" | "jobs" | "candidates";

type MockState = {
  subscriber: {
    id: string;
    email: string;
    status: MockSubscriberStatus;
    confirmedAt: Date | null;
    unsubscribedAt: Date | null;
    source: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  preferences: Array<{
    id: string;
    subscriberId: string;
    newsletterType: MockNewsletterType;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
  subscriberUpdates: Array<Record<string, unknown>>;
};

function resetState(
  state: MockState,
  subscriberStatus: MockSubscriberStatus,
  enabledTypes: MockNewsletterType[]
) {
  const now = new Date("2026-03-09T10:00:00.000Z");
  state.subscriber = {
    id: "sub_123",
    email: "reader@example.com",
    status: subscriberStatus,
    confirmedAt: subscriberStatus === "pending" ? null : now,
    unsubscribedAt: subscriberStatus === "unsubscribed" ? now : null,
    source: "news-page",
    createdAt: now,
    updatedAt: now,
  };
  state.preferences = (["news", "jobs", "candidates"] as const).map((newsletterType, index) => ({
    id: `pref_${index + 1}`,
    subscriberId: "sub_123",
    newsletterType,
    enabled: enabledTypes.includes(newsletterType),
    createdAt: now,
    updatedAt: now,
  }));
  state.subscriberUpdates = [];
}

describe("adminUpdateSubscriberPreferences", () => {
  afterEach(() => {
    mock.restore();
  });

  test("updates subscriber status without auto-confirming pending subscribers", async () => {
    const actualPosthog = await import("../src/services/posthog");
    const state: MockState = {
      subscriber: null,
      preferences: [],
      subscriberUpdates: [],
    };

    const newsletterSubscribers = { table: "newsletter_subscribers" };
    const newsletterPreferences = { table: "newsletter_preferences" };

    mock.module("@/db", () => ({
      db: {
        select: () => ({
          from: (table: unknown) => ({
            where: () => {
              if (table === newsletterSubscribers) {
                return makeQueryResult(state.subscriber ? [state.subscriber] : []);
              }
              if (table === newsletterPreferences) {
                return makeQueryResult(state.preferences);
              }
              return makeQueryResult([]);
            },
          }),
        }),
        update: (table: unknown) => ({
          set: (values: Record<string, unknown>) => ({
            where: () => {
              if (table === newsletterSubscribers) {
                state.subscriberUpdates.push(values);
                if (state.subscriber) {
                  state.subscriber = {
                    ...state.subscriber,
                    ...values,
                  };
                }
              }
              return makeAwaitable([]);
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
      newsletterSubscribers,
      newsletterPreferences,
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

    const { adminUpdateSubscriberPreferences } = await import("../src/services/newsletter");

    resetState(state, "active", ["news"]);
    const unsubscribedResult = await adminUpdateSubscriberPreferences("sub_123", []);
    expect(unsubscribedResult.ok).toBe(true);
    if (!unsubscribedResult.ok) throw new Error("expected unsubscribed result");
    expect(state.subscriberUpdates[0]?.status).toBe("unsubscribed");
    expect(state.subscriberUpdates[0]?.unsubscribedAt).toBeInstanceOf(Date);
    expect(unsubscribedResult.data.subscriber.status).toBe("unsubscribed");

    resetState(state, "unsubscribed", []);
    const activeResult = await adminUpdateSubscriberPreferences("sub_123", ["news"]);
    expect(activeResult.ok).toBe(true);
    if (!activeResult.ok) throw new Error("expected active result");
    expect(state.subscriberUpdates[0]?.status).toBe("active");
    expect(state.subscriberUpdates[0]?.unsubscribedAt).toBeNull();
    expect(activeResult.data.subscriber.status).toBe("active");

    resetState(state, "pending", ["news"]);
    const pendingResult = await adminUpdateSubscriberPreferences("sub_123", ["jobs"]);
    expect(pendingResult.ok).toBe(true);
    if (!pendingResult.ok) throw new Error("expected pending result");
    expect(state.subscriberUpdates[0]?.status).toBe("pending");
    expect(pendingResult.data.subscriber.status).toBe("pending");
    expect(
      pendingResult.data.preferences.find((preference) => preference.newsletterType === "jobs")?.enabled
    ).toBe(true);
    expect(
      pendingResult.data.preferences.find((preference) => preference.newsletterType === "news")?.enabled
    ).toBe(false);
  });
});
