import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import { adminUpdateSubscriberPreferences } from "@/services/newsletter-admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

  let body: { newsletterTypes?: string[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.newsletterTypes)) {
    return Response.json({ error: "newsletterTypes must be an array" }, { status: 400 });
  }

  const { id } = await params;
  const result = await adminUpdateSubscriberPreferences(id, body.newsletterTypes);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ data: result.data });
}
