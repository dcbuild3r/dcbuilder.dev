import { NextRequest } from "next/server";
import { listAgentInbox, parseAgentFilters } from "@/services/agent-api";
import { requireAuth } from "@/services/auth";
import { jsonError } from "../_utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "admin:read");
  if (auth instanceof Response) return auth;
  try {
    return Response.json(await listAgentInbox(parseAgentFilters(request.nextUrl.searchParams)));
  } catch (error) {
    return jsonError(error);
  }
}
