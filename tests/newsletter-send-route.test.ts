import { afterEach, describe, expect, mock, test } from "bun:test";

describe("POST /api/cron/newsletter-send", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  afterEach(() => {
    mock.restore();
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
  });

  test("returns 500 when any scheduled campaign send fails", async () => {
    process.env.CRON_SECRET = "test-secret";
    const actualNewsletter = await import("../src/services/newsletter");

    const sendDueNewsletterCampaigns = mock(async () => ({
      ok: true as const,
      data: {
        processed: 1,
        results: [
          {
            campaignId: "camp-1",
            result: { ok: false as const, status: 409, error: "No active recipients for this campaign type" },
          },
        ],
      },
    }));

    mock.module("@/services/newsletter", () => ({
      ...actualNewsletter,
      sendDueNewsletterCampaigns,
    }));

    const { POST } = await import("../src/app/api/cron/newsletter-send/route");
    const response = await POST(
      new Request("https://dcbuilder.dev/api/cron/newsletter-send", {
        method: "POST",
        headers: { authorization: "Bearer test-secret" },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toContain("camp-1");
    expect(payload.processed).toBe(1);
  });

  test("returns 500 when a campaign send completes with failed recipients", async () => {
    process.env.CRON_SECRET = "test-secret";
    const actualNewsletter = await import("../src/services/newsletter");

    const sendDueNewsletterCampaigns = mock(async () => ({
      ok: true as const,
      data: {
        processed: 1,
        results: [
          {
            campaignId: "camp-2",
            result: {
              ok: true as const,
              data: { campaignId: "camp-2", sent: 12, failed: 3, skipped: 0, alreadySent: false },
            },
          },
        ],
      },
    }));

    mock.module("@/services/newsletter", () => ({
      ...actualNewsletter,
      sendDueNewsletterCampaigns,
    }));

    const { POST } = await import("../src/app/api/cron/newsletter-send/route");
    const response = await POST(
      new Request("https://dcbuilder.dev/api/cron/newsletter-send", {
        method: "POST",
        headers: { authorization: "Bearer test-secret" },
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toContain("camp-2");
    expect(payload.processed).toBe(1);
  });
});
