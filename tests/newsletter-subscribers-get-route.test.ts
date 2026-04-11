import { afterEach, describe, expect, mock, test } from "bun:test";
import { createPosthogModuleMock } from "./helpers/posthog-module-mock";

describe("GET /api/v1/newsletter/subscribers", () => {
  afterEach(() => {
    mock.restore();
  });

  test("returns an unavailable fallback instead of 500 when subscriber tables are missing", async () => {
    const actualDb = await import("../src/db");
    const actualAuth = await import("../src/services/auth");

    mock.module("@/services/auth", () => ({
      ...actualAuth,
      requireAuth: async () => ({ valid: true as const, keyId: "key_123", name: "Admin" }),
    }));
    mock.module("@/db", () => ({
      ...actualDb,
      db: {
        select: () => ({
          from: () => {
            throw new Error('relation "newsletter_subscribers" does not exist');
          },
        }),
      },
    }));
    mock.module("@/services/posthog", () =>
      createPosthogModuleMock({
        getEmailClicksLast7Days: async () => ({ success: true as const, data: [] }),
      })
    );

    const { GET } = await import("../src/app/api/v1/newsletter/subscribers/route");
    const response = await GET(
      new Request("https://dcbuilder.dev/api/v1/newsletter/subscribers?limit=50") as never
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.meta.newsletterUnavailable).toBe(true);
  });
});
