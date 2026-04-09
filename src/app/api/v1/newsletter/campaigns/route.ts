import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import { createNewsletterCampaign, listNewsletterCampaigns } from "@/services/newsletter";
import {
  getNewsletterAvailabilityMeta,
  isMissingNewsletterSchemaError,
  NEWSLETTER_DB_UNAVAILABLE_ERROR,
} from "@/services/newsletter-schema";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "admin:read");
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  try {
    const campaigns = await listNewsletterCampaigns(Number.isNaN(limit) ? 50 : limit);
    return Response.json({ data: campaigns });
  } catch (error) {
    console.error("[api/newsletter/campaigns] GET failed:", error);

    if (isMissingNewsletterSchemaError(error)) {
      return Response.json({
        data: [],
        meta: getNewsletterAvailabilityMeta(),
      });
    }

    return Response.json({ error: "Failed to load newsletter campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

  let body: {
    newsletterType?: string;
    subject?: string;
    previewText?: string;
    timeframePreset?: string;
    periodDays?: number;
    minimumRelevance?: number;
    scheduledAt?: string;
    createdBy?: string;
    contentMode?: string;
    markdownContent?: string;
    manualHtml?: string;
    manualText?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let result;
  try {
    result = await createNewsletterCampaign({
      newsletterType: body.newsletterType || "",
      subject: body.subject || "",
      previewText: body.previewText,
      timeframePreset: body.timeframePreset,
      periodDays: body.periodDays,
      minimumRelevance: body.minimumRelevance,
      scheduledAt: body.scheduledAt,
      createdBy: body.createdBy,
      contentMode: body.contentMode,
      markdownContent: body.markdownContent,
      manualHtml: body.manualHtml,
      manualText: body.manualText,
    });
  } catch (error) {
    console.error("[api/newsletter/campaigns] POST failed:", error);
    if (isMissingNewsletterSchemaError(error)) {
      return Response.json(
        { error: NEWSLETTER_DB_UNAVAILABLE_ERROR, meta: getNewsletterAvailabilityMeta() },
        { status: 503 }
      );
    }
    return Response.json({ error: "Failed to create newsletter campaign" }, { status: 500 });
  }

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ data: result.data }, { status: 201 });
}
