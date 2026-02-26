import { NextRequest, NextResponse } from "next/server";
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

const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (RESEND_WEBHOOK_SECRET) {
    const signature = request.headers.get("svix-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
  }

  let payload: ResendWebhookPayload;
  try {
    payload = await request.json();
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
