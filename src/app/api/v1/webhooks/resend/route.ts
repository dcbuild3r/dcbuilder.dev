import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { db, newsletterSendEvents } from "@/db";

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    click?: {
      ipAddress: string;
      link: string;
      timestamp: string;
      userAgent: string;
    };
  };
}

function verifySvixSignature(secret: string, msgId: string, timestamp: string, body: string, signatures: string): boolean {
  const toSign = `${msgId}.${timestamp}.${body}`;
  // Svix secrets are base64-encoded with "whsec_" prefix
  const secretBytes = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
  const expected = createHmac("sha256", secretBytes).update(toSign).digest("base64");
  // signatures is space-separated list of "v1,<base64>" entries
  return signatures.split(" ").some((sig) => {
    const parts = sig.split(",");
    if (parts.length < 2 || parts[0] !== "v1") return false;
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(parts[1]));
    } catch {
      return false;
    }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const resendWebhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!resendWebhookSecret) {
    return NextResponse.json(
      { error: "RESEND_WEBHOOK_SECRET is not configured" },
      { status: 503 }
    );
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
  }
  if (!verifySvixSignature(resendWebhookSecret, svixId, svixTimestamp, body, svixSignature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: ResendWebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload.type;

  // Forward click events to PostHog
  if (eventType === "email.clicked" && payload.data.click) {
    const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com";

    if (posthogApiKey) {
      const distinctId = payload.data.to?.[0] || "anonymous";
      await fetch(`${posthogHost}/capture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: posthogApiKey,
          event: "email_link_clicked",
          distinct_id: distinctId,
          properties: {
            email_id: payload.data.email_id,
            link: payload.data.click.link,
            subject: payload.data.subject,
            user_agent: payload.data.click.userAgent,
            ip: payload.data.click.ipAddress,
            $current_url: payload.data.click.link,
          },
          timestamp: payload.data.click.timestamp,
        }),
      }).catch(() => {});
    }
  }

  // Log bounce/complaint events to newsletter_send_events
  if (eventType === "email.bounced" || eventType === "email.complained") {
    const mappedType =
      eventType === "email.bounced" ? "bounced" : "complained";
    await db
      .insert(newsletterSendEvents)
      .values({
        campaignId: "webhook",
        eventType: mappedType,
        provider: "resend",
        providerMessageId: payload.data.email_id,
        payload: JSON.stringify(payload.data),
      })
      .catch(() => {});
  }

  return NextResponse.json({ received: true });
}
