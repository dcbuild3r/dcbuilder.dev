import { afterEach, describe, expect, mock, test } from "bun:test";

describe("GET /api/v1/newsletter/preferences", () => {
  afterEach(() => {
    mock.restore();
  });

  test("renders an HTML preferences page for a valid token", async () => {
    const actualNewsletter = await import("../src/services/newsletter");
    const getPreferenceContext = mock(async () => ({
      ok: true as const,
      data: {
        email: "reader@example.com",
        preferences: [
          { type: "news", enabled: true },
          { type: "jobs", enabled: false },
          { type: "candidates", enabled: true },
        ],
      },
    }));

    mock.module("@/services/newsletter", () => ({
      ...actualNewsletter,
      getPreferenceContext,
    }));

    const { GET } = await import("../src/app/api/v1/newsletter/preferences/route");
    const response = await GET(new Request("https://dcbuilder.dev/api/v1/newsletter/preferences?token=test-token"));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("reader@example.com");
    expect(body).toContain("Manage your newsletter preferences");
    expect(body).toContain('value="news"');
    expect(body).toContain('value="candidates"');
    expect(body).toContain("checked");
  });
});
