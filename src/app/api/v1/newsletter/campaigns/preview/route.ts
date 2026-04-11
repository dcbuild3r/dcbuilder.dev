import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import { previewNewsletterCampaignDraft } from "@/services/newsletter";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "admin:read");
  if (auth instanceof Response) return auth;

  let body: {
    newsletterType?: string;
    subject?: string;
    timeframePreset?: string;
    periodDays?: number;
    minimumRelevance?: number;
    contentMode?: string;
    markdownContent?: string | null;
    manualHtml?: string | null;
    manualText?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await previewNewsletterCampaignDraft({
    newsletterType: body.newsletterType || "",
    subject: body.subject || "",
    timeframePreset: body.timeframePreset,
    periodDays: body.periodDays,
    minimumRelevance: body.minimumRelevance,
    contentMode: body.contentMode,
    markdownContent: body.markdownContent,
    manualHtml: body.manualHtml,
    manualText: body.manualText,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ data: result.data });
}
