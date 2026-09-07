import { NextRequest } from "next/server";
import { getAgentSubmission } from "@/services/agent-api";
import { requireAuth } from "@/services/auth";
import { jsonError } from "../../_utils";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request, "admin:read");
  if (auth instanceof Response) return auth;
  try {
    const { id } = await params;
    const data = await getAgentSubmission(id);
    if (!data) return Response.json({ error: "Submission not found" }, { status: 404 });
    return Response.json({ data });
  } catch (error) {
    return jsonError(error);
  }
}
