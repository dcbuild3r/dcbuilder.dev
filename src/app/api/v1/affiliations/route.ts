import { NextRequest } from "next/server";
import { db, affiliations, NewAffiliation } from "@/db";
import { desc } from "drizzle-orm";
import { requireAuth, parsePaginationParams } from "@/services/auth";

// GET /api/v1/affiliations - List affiliations
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const { limit, offset } = parsePaginationParams(searchParams);

  try {
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
  } catch (error) {
    console.error("[api/affiliations] GET failed:", error);
    return Response.json(
      { error: "Failed to fetch affiliations", code: "DB_QUERY_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v1/affiliations - Create an affiliation
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "affiliations:write");
  if (auth instanceof Response) return auth;

  try {
    const body = (await request.json()) as NewAffiliation;

    if (!body.title || !body.role) {
      return Response.json(
        { error: "Missing required fields: title, role", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const [newAffiliation] = await db
      .insert(affiliations)
      .values(body)
      .returning();

    return Response.json({ data: newAffiliation }, { status: 201 });
  } catch (error) {
    console.error("[api/affiliations] POST failed:", error);

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return Response.json(
        { error: "An affiliation with this identifier already exists", code: "DUPLICATE_KEY" },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to create affiliation", code: "DB_INSERT_ERROR" },
      { status: 500 }
    );
  }
}
