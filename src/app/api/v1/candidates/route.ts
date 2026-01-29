import { NextRequest } from "next/server";
import { db, candidates, NewCandidate } from "@/db";
import { eq, desc, and, SQL } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

// GET /api/v1/candidates - List candidates with optional filters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const available = searchParams.get("available");
  const featured = searchParams.get("featured");
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

  const conditions: SQL[] = [];

  if (available === "true") {
    conditions.push(eq(candidates.available, true));
  } else if (available === "false") {
    conditions.push(eq(candidates.available, false));
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
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    const [newCandidate] = await db
      .insert(candidates)
      .values(body)
      .returning();

    return Response.json({ data: newCandidate }, { status: 201 });
  } catch (error) {
    console.error("Failed to create candidate:", error);
    return Response.json(
      { error: "Failed to create candidate" },
      { status: 500 }
    );
  }
}
