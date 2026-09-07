import { NextRequest } from "next/server";
import { rejectAgentSubmission } from "@/services/agent-api";
import { requireAuth } from "@/services/auth";
import { jsonError } from "../../../_utils";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;
  if (!auth.valid) return Response.json({ error: auth.error }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    return Response.json({ data: await rejectAgentSubmission(id, body, auth) });
  } catch (error) {
    return jsonError(error);
  }
}
