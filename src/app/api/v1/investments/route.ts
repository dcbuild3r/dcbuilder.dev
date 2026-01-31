import { NextRequest } from "next/server";
import { db, investments, NewInvestment } from "@/db";
import { eq, desc, and, SQL, arrayContains } from "drizzle-orm";
import { requireAuth, parsePaginationParams } from "@/lib/api-auth";

// GET /api/v1/investments - List investments
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tier = searchParams.get("tier");
  const featured = searchParams.get("featured");
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const { limit, offset } = parsePaginationParams(searchParams);

  try {
    const conditions: SQL[] = [];

    if (tier) {
      conditions.push(eq(investments.tier, tier));
    }
    if (featured === "true") {
      conditions.push(eq(investments.featured, true));
    }
    if (status) {
      conditions.push(eq(investments.status, status));
    }
    if (category) {
      conditions.push(arrayContains(investments.categories, [category]));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(investments)
      .where(whereClause)
      .orderBy(desc(investments.featured), investments.tier, investments.title)
      .limit(limit)
      .offset(offset);

    return Response.json({
      data,
      meta: { limit, offset },
    });
  } catch (error) {
    console.error("[api/investments] GET failed:", error);
    return Response.json(
      { error: "Failed to fetch investments", code: "DB_QUERY_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v1/investments - Create an investment
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "investments:write");
  if (auth instanceof Response) return auth;

  try {
    const body = (await request.json()) as NewInvestment;

    if (!body.title) {
      return Response.json(
        { error: "Missing required field: title", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const [newInvestment] = await db
      .insert(investments)
      .values(body)
      .returning();

    return Response.json({ data: newInvestment }, { status: 201 });
  } catch (error) {
    console.error("[api/investments] POST failed:", error);

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return Response.json(
        { error: "An investment with this identifier already exists", code: "DUPLICATE_KEY" },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to create investment", code: "DB_INSERT_ERROR" },
      { status: 500 }
    );
  }
}
