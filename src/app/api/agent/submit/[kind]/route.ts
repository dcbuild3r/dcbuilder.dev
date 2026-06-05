import { NextRequest } from "next/server";
import { createAgentSubmissionFromRequest } from "@/services/agent-api";
import { jsonError, optionalAuth } from "../../_utils";

export const runtime = "nodejs";

type Params = { params: Promise<{ kind: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { kind } = await params;
    const auth = await optionalAuth(request);
    if (auth && !auth.valid) {
      // The service will still try bearer submit-token auth for structured submissions.
      return Response.json({ data: await createAgentSubmissionFromRequest(kind, request, auth) }, { status: 201 });
    }
    return Response.json({ data: await createAgentSubmissionFromRequest(kind, request, auth) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
