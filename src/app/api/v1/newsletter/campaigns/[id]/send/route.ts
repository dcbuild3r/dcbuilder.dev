import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import { sendNewsletterCampaignNow } from "@/services/newsletter";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const result = await sendNewsletterCampaignNow(id);

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result.data);
}
