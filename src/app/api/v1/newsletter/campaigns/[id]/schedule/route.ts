import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import { scheduleNewsletterCampaign } from "@/services/newsletter";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

  let body: { scheduledAt?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.scheduledAt) {
    return Response.json({ error: "scheduledAt is required" }, { status: 400 });
  }

  const { id } = await params;
  const result = await scheduleNewsletterCampaign(id, body.scheduledAt);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ data: result.data });
}
