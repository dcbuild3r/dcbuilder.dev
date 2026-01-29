import { NextRequest } from "next/server";
import { db, affiliations, NewAffiliation } from "@/db";
import { desc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

// GET /api/v1/affiliations - List affiliations
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  const data = await db
    .select()
    .from(affiliations)
    .orderBy(desc(affiliations.createdAt))
    .limit(limit)
    .offset(offset);

  return Response.json({
    data,
    meta: { limit, offset },
  });
}

// POST /api/v1/affiliations - Create an affiliation
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "affiliations:write");
  if (auth instanceof Response) return auth;

  try {
    const body = (await request.json()) as NewAffiliation;

    if (!body.title || !body.role) {
      return Response.json(
        { error: "Missing required fields: title, role" },
        { status: 400 }
      );
    }

    const [newAffiliation] = await db
      .insert(affiliations)
      .values(body)
      .returning();

    return Response.json({ data: newAffiliation }, { status: 201 });
  } catch (error) {
    console.error("Failed to create affiliation:", error);
    return Response.json(
      { error: "Failed to create affiliation" },
      { status: 500 }
    );
  }
}
