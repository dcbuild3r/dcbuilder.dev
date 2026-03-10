import { afterEach, describe, expect, test } from "bun:test";

describe("POST /api/v1/webhooks/resend", () => {
  const originalWebhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  afterEach(() => {
    if (originalWebhookSecret === undefined) {
      delete process.env.RESEND_WEBHOOK_SECRET;
    } else {
      process.env.RESEND_WEBHOOK_SECRET = originalWebhookSecret;
    }
  });

  test("fails closed when the webhook secret is not configured", async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;

    const { POST } = await import("../src/app/api/v1/webhooks/resend/route");
    const response = await POST(
      new Request("https://dcbuilder.dev/api/v1/webhooks/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email.clicked", data: { to: ["reader@example.com"] } }),
      }) as never
    );
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toContain("RESEND_WEBHOOK_SECRET");
  });
});
