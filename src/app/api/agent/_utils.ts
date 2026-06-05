import { NextRequest } from "next/server";
import { AgentHttpError } from "@/services/agent-api";
import type { AuthResult } from "@/services/auth";
import { extractRequestToken, validateApiKey } from "@/services/auth";

export function jsonError(error: unknown) {
  if (error instanceof AgentHttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("[api/agent] request failed", error);
  return Response.json({ error: "Agent API request failed" }, { status: 500 });
}

export async function optionalAuth(request: NextRequest | Request): Promise<AuthResult | undefined> {
  if (!extractRequestToken(request)) return undefined;
  return validateApiKey(request as NextRequest);
}

export function authPermissions(auth: AuthResult | undefined) {
  return auth?.valid ? auth.permissions : [];
}
