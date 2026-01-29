import { NextRequest } from "next/server";
import { db, apiKeys } from "@/db";
import { eq } from "drizzle-orm";

export type AuthResult =
  | { valid: true; keyId: string; name: string }
  | { valid: false; error: string };

export async function validateApiKey(
  request: NextRequest,
  requiredPermission?: string
): Promise<AuthResult> {
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return { valid: false, error: "Missing API key" };
  }

  const [key] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.key, apiKey))
    .limit(1);

  if (!key) {
    return { valid: false, error: "Invalid API key" };
  }

  // Check permissions if required
  if (requiredPermission) {
    const hasPermission =
      key.permissions?.includes("*") ||
      key.permissions?.includes(requiredPermission);
    if (!hasPermission) {
      return { valid: false, error: "Insufficient permissions" };
    }
  }

  // Update last used timestamp (fire and forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id))
    .execute()
    .catch(() => {}); // Ignore errors

  return { valid: true, keyId: key.id, name: key.name };
}

// Helper to create unauthorized response
export function unauthorizedResponse(error: string) {
  return Response.json({ error }, { status: 401 });
}

// Helper to check auth and return early if invalid
export async function requireAuth(
  request: NextRequest,
  permission?: string
): Promise<AuthResult | Response> {
  const auth = await validateApiKey(request, permission);
  if (!auth.valid) {
    return unauthorizedResponse(auth.error);
  }
  return auth;
}
