import { NextRequest } from "next/server";
import { db, apiKeys } from "@/db";
import { eq } from "drizzle-orm";

// Pagination parameter parsing with validation
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { limit: number; maxLimit: number } = { limit: 100, maxLimit: 500 }
): { limit: number; offset: number } {
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  let limit = defaults.limit;
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, defaults.maxLimit);
    }
  }

  let offset = 0;
  if (offsetParam) {
    const parsed = parseInt(offsetParam, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  return { limit, offset };
}

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

  let key;
  try {
    const [result] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, apiKey))
      .limit(1);
    key = result;
  } catch (error) {
    console.error("[api-auth] Database error during API key validation:", error);
    return { valid: false, error: "Authentication service unavailable" };
  }

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

  // Update last used timestamp (non-blocking - auth succeeds even if tracking fails)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, key.id))
    .execute()
    .catch((error) => {
      console.warn("[api-auth] Failed to update API key lastUsedAt:", error);
    });

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
