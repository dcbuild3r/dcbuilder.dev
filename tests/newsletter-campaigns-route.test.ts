import { afterEach, describe, expect, mock, test } from "bun:test";

describe("GET /api/v1/newsletter/campaigns", () => {
  afterEach(() => {
    mock.restore();
  });

  test("returns an unavailable fallback instead of 500 when the campaigns table is missing", async () => {
    const actualNewsletter = await import("../src/services/newsletter");
    mock.module("@/services/auth", () => ({
      requireAuth: async () => ({ valid: true as const, keyId: "key_123", name: "Admin" }),
    }));
    mock.module("@/services/newsletter", () => ({
      ...actualNewsletter,
      listNewsletterCampaigns: async () => {
        throw new Error('relation "newsletter_campaigns" does not exist');
      },
      createNewsletterCampaign: async () => ({ ok: true as const, data: null }),
    }));

    const { GET } = await import("../src/app/api/v1/newsletter/campaigns/route");
    const response = await GET(
      new Request("https://dcbuilder.dev/api/v1/newsletter/campaigns?limit=25") as never
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.meta.newsletterUnavailable).toBe(true);
    expect(body.meta.reason).toContain("temporarily unavailable");
  });
});
