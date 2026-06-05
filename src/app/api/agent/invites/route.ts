import { NextRequest } from "next/server";
import { createAgentInvite } from "@/services/agent-api";
import { requireAuth } from "@/services/auth";
import { jsonError } from "../_utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;
  if (!auth.valid) return Response.json({ error: auth.error }, { status: 401 });
  try {
    return Response.json({ data: await createAgentInvite(await request.json(), auth) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
