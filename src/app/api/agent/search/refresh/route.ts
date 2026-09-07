import { NextRequest } from "next/server";
import { refreshAgentSearchDocuments } from "@/services/agent-api";
import { requireAuth } from "@/services/auth";
import { jsonError } from "../../_utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;
  try {
    const body = await request.json().catch(() => ({}));
    const resource = typeof body.resource === "string" ? body.resource : undefined;
    return Response.json({ data: await refreshAgentSearchDocuments(resource) });
  } catch (error) {
    return jsonError(error);
  }
}
