import { NextRequest } from "next/server";
import { listAgentResource, parseAgentFilters } from "@/services/agent-api";
import { requireAuth } from "@/services/auth";
import { jsonError } from "../_utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "agent:read");
  if (auth instanceof Response) return auth;
  if (!auth.valid) return Response.json({ error: auth.error }, { status: 401 });
  try {
    return Response.json(await listAgentResource("candidates", parseAgentFilters(request.nextUrl.searchParams), auth.permissions));
  } catch (error) {
    return jsonError(error);
  }
}
