import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import { renderNewsletterTemplatePreview } from "@/services/newsletter";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "admin:read");
  if (auth instanceof Response) return auth;

  let body: {
    newsletterType?: string;
    timeframePreset?: string;
    periodDays?: number;
    minimumRelevance?: number;
    campaignSubject?: string;
    subjectTemplate?: string;
    htmlTemplate?: string;
    textTemplate?: string;
    markdownTemplate?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await renderNewsletterTemplatePreview({
    newsletterType: body.newsletterType || "",
    timeframePreset: body.timeframePreset,
    periodDays: body.periodDays,
    minimumRelevance: body.minimumRelevance,
    campaignSubject: body.campaignSubject,
    subjectTemplate: body.subjectTemplate,
    htmlTemplate: body.htmlTemplate,
    textTemplate: body.textTemplate,
    markdownTemplate: body.markdownTemplate,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ data: result.data });
}
