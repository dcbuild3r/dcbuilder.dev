import { afterEach, describe, expect, mock, test } from "bun:test";

describe("PATCH /api/v1/newsletter/subscribers/[id]", () => {
  afterEach(() => {
    mock.restore();
  });

  test("requires admin write access, validates the body, and returns updated subscriber data", async () => {
    let requestedPermission: string | undefined;
    let calledId: string | null = null;
    let calledNewsletterTypes: string[] | null = null;

    mock.module("@/services/auth", () => ({
      requireAuth: async (_request: Request, permission?: string) => {
        requestedPermission = permission;
        return { valid: true as const, keyId: "key_123", name: "Admin" };
      },
    }));
    mock.module("@/services/newsletter-admin", () => ({
      adminUpdateSubscriberPreferences: async (id: string, newsletterTypes: string[]) => {
        calledId = id;
        calledNewsletterTypes = newsletterTypes;
        return {
          ok: true as const,
          data: {
            subscriber: {
              id,
              email: "reader@example.com",
              status: "active",
            },
            preferences: [
              { newsletterType: "news", enabled: true },
              { newsletterType: "jobs", enabled: false },
              { newsletterType: "candidates", enabled: true },
            ],
          },
        };
      },
    }));

    const { PATCH } = await import("../src/app/api/v1/newsletter/subscribers/[id]/route");

    const response = await PATCH(
      new Request("https://dcbuilder.dev/api/v1/newsletter/subscribers/sub_123", {
        method: "PATCH",
        body: JSON.stringify({ newsletterTypes: ["news", "candidates"] }),
      }) as never,
      { params: Promise.resolve({ id: "sub_123" }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(requestedPermission).toBe("admin:write");
    expect(calledId === "sub_123").toBe(true);
    expect(JSON.stringify(calledNewsletterTypes)).toBe(JSON.stringify(["news", "candidates"]));
    expect(body.data.subscriber.status).toBe("active");
    expect(body.data.preferences).toHaveLength(3);

    calledId = null;
    calledNewsletterTypes = null;
    const invalidResponse = await PATCH(
      new Request("https://dcbuilder.dev/api/v1/newsletter/subscribers/sub_123", {
        method: "PATCH",
        body: JSON.stringify({}),
      }) as never,
      { params: Promise.resolve({ id: "sub_123" }) }
    );
    const invalidBody = await invalidResponse.json();

    expect(invalidResponse.status).toBe(400);
    expect(invalidBody.error).toBe("newsletterTypes must be an array");
    expect(calledId).toBeNull();
    expect(calledNewsletterTypes).toBeNull();
  });
});
