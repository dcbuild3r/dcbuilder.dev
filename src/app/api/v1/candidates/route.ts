import { NextRequest } from "next/server";
import { db, candidates, NewCandidate } from "@/db";
import { eq, desc, and, SQL } from "drizzle-orm";
import { requireAuth, parsePaginationParams } from "@/lib/api-auth";

// GET /api/v1/candidates - List candidates with optional filters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const availability = searchParams.get("availability"); // "looking" | "open" | "not-looking"
  const featured = searchParams.get("featured");
  const { limit, offset } = parsePaginationParams(searchParams);

  try {
    const conditions: SQL[] = [];

    if (availability && ["looking", "open", "not-looking"].includes(availability)) {
      conditions.push(eq(candidates.availability, availability));
    }
    if (featured === "true") {
      conditions.push(eq(candidates.featured, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(candidates)
        .where(whereClause)
        .orderBy(desc(candidates.featured), desc(candidates.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: candidates.id })
        .from(candidates)
        .where(whereClause),
    ]);

    return Response.json({
      data,
      meta: {
        total: countResult.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("[api/candidates] GET failed:", error);
    return Response.json(
      { error: "Failed to fetch candidates", code: "DB_QUERY_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v1/candidates - Create a new candidate
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "candidates:write");
  if (auth instanceof Response) return auth;

  try {
    const body = (await request.json()) as NewCandidate;

    // Validate required fields
    if (!body.name) {
      return Response.json(
        { error: "Missing required field: name", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const [newCandidate] = await db
      .insert(candidates)
      .values(body)
      .returning();

    return Response.json({ data: newCandidate }, { status: 201 });
  } catch (error) {
    console.error("[api/candidates] POST failed:", error);

    // Check for common database errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key")) {
        return Response.json(
          { error: "A candidate with this identifier already exists", code: "DUPLICATE_KEY" },
          { status: 409 }
        );
      }
    }

    return Response.json(
      { error: "Failed to create candidate", code: "DB_INSERT_ERROR" },
      { status: 500 }
    );
  }
}
