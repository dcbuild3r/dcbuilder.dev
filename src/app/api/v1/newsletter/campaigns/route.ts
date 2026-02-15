import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import { createNewsletterCampaign, listNewsletterCampaigns } from "@/services/newsletter";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "admin:read");
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const campaigns = await listNewsletterCampaigns(Number.isNaN(limit) ? 50 : limit);
  return Response.json({ data: campaigns });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

  let body: {
    newsletterType?: string;
    subject?: string;
    previewText?: string;
    periodDays?: number;
    scheduledAt?: string;
    createdBy?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await createNewsletterCampaign({
    newsletterType: body.newsletterType || "",
    subject: body.subject || "",
    previewText: body.previewText,
    periodDays: body.periodDays,
    scheduledAt: body.scheduledAt,
    createdBy: body.createdBy,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ data: result.data }, { status: 201 });
}
