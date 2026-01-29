import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";

// GET /api/v1/admin/auth - Validate admin API key
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  return Response.json({ data: { ok: true } });
}
