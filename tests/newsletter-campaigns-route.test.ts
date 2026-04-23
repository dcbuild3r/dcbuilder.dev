import { afterEach, describe, expect, mock, test } from "bun:test";

describe("GET /api/v1/newsletter/campaigns", () => {
  afterEach(() => {
    mock.restore();
  });

  test("returns an unavailable fallback instead of 500 when the campaigns table is missing", async () => {
    mock.module("@/services/auth", () => ({
      requireAuth: async () => ({ valid: true as const, keyId: "key_123", name: "Admin" }),
    }));
    mock.module("@/services/newsletter", () => ({
      listNewsletterCampaigns: async () => {
        throw new Error('relation "newsletter_campaigns" does not exist');
      },
      createNewsletterCampaign: async () => ({ ok: true as const, data: null }),
      previewNewsletterCampaignDraft: async () => ({
        ok: true as const,
        data: {
          rendered: { subject: "Preview", html: "<p>Preview</p>", text: "Preview" },
          starter: { markdown: "## News digest" },
          placeholders: [],
          context: { digest: { heading: "News digest", summary: "Preview", periodDays: 7, items: [] }, recentNews: [] },
        },
      }),
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

  test("passes timeframePreset and minimumRelevance through create and preview routes", async () => {
    const calls: Array<{ kind: "create" | "preview"; payload: unknown }> = [];

    mock.module("@/services/auth", () => ({
      requireAuth: async () => ({ valid: true as const, keyId: "key_123", name: "Admin" }),
    }));
    mock.module("@/services/newsletter", () => ({
      listNewsletterCampaigns: async () => [],
      createNewsletterCampaign: async (payload: unknown) => {
        calls.push({ kind: "create", payload });
        return { ok: true as const, data: { id: "cmp_123" } };
      },
      previewNewsletterCampaignDraft: async (payload: unknown) => {
        calls.push({ kind: "preview", payload });
        return {
          ok: true as const,
          data: {
            rendered: { subject: "Quarterly digest", html: "<p>Preview</p>", text: "Preview" },
            starter: { markdown: "## AI" },
            placeholders: [],
            context: {
              digest: { heading: "News digest", summary: "Quarterly highlights", periodDays: 90, items: [] },
              recentNews: [],
            },
          },
        };
      },
    }));

    const { POST: createCampaign } = await import(
      `../src/app/api/v1/newsletter/campaigns/route?newsletter-campaign-create=${Date.now()}`
    );
    const createResponse = await createCampaign(
      new Request("https://dcbuilder.dev/api/v1/newsletter/campaigns", {
        method: "POST",
        body: JSON.stringify({
          newsletterType: "news",
          subject: "Quarterly digest",
          timeframePreset: "quarterly",
          minimumRelevance: 8,
        }),
      }) as never
    );

    const { POST: previewCampaign } = await import(
      `../src/app/api/v1/newsletter/campaigns/preview/route?newsletter-campaign-preview=${Date.now()}`
    );
    const previewResponse = await previewCampaign(
      new Request("https://dcbuilder.dev/api/v1/newsletter/campaigns/preview", {
        method: "POST",
        body: JSON.stringify({
          newsletterType: "news",
          subject: "Quarterly digest",
          timeframePreset: "quarterly",
          minimumRelevance: 8,
        }),
      }) as never
    );

    expect(createResponse.status).toBe(201);
    expect(previewResponse.status).toBe(200);
    expect(calls).toEqual([
      {
        kind: "create",
        payload: expect.objectContaining({
          timeframePreset: "quarterly",
          minimumRelevance: 8,
        }),
      },
      {
        kind: "preview",
        payload: expect.objectContaining({
          timeframePreset: "quarterly",
          minimumRelevance: 8,
        }),
      },
    ]);
  });
});
