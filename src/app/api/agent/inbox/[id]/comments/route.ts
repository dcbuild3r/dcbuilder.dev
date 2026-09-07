import { NextRequest } from "next/server";
import { commentAgentSubmission } from "@/services/agent-api";
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
    return Response.json({ data: await commentAgentSubmission(id, await request.json(), auth) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
