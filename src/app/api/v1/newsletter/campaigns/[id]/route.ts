import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import {
  deleteNewsletterCampaign,
  getNewsletterCampaignById,
  updateNewsletterCampaign,
} from "@/services/newsletter";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "admin:read");
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const result = await getNewsletterCampaignById(id);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ data: result.data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

  let body: {
    newsletterType?: string;
    subject?: string;
    previewText?: string | null;
    timeframePreset?: string;
    periodDays?: number;
    minimumRelevance?: number;
    scheduledAt?: string | null;
    contentMode?: string;
    markdownContent?: string | null;
    manualHtml?: string | null;
    manualText?: string | null;
    archiveOnly?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id } = await params;
  const correctedBy = auth.valid
    ? ("name" in auth && auth.name ? auth.name : ("keyId" in auth ? auth.keyId : null))
    : null;
  const result = await updateNewsletterCampaign(id, {
    ...body,
    correctedBy,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ data: result.data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const result = await deleteNewsletterCampaign(id);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ data: result.data });
}
