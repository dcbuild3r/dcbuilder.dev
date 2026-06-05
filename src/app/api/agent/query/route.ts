import { NextRequest } from "next/server";
import { runAgentQuery } from "@/services/agent-api";
import { requireAuth } from "@/services/auth";
import { jsonError } from "../_utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "agent:read");
  if (auth instanceof Response) return auth;
  if (!auth.valid) return Response.json({ error: auth.error }, { status: 401 });
  try {
    return Response.json(await runAgentQuery(await request.json(), auth.permissions));
  } catch (error) {
    return jsonError(error);
  }
}
