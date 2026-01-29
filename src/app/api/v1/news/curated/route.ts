import { NextRequest } from "next/server";
import { db, curatedLinks, NewCuratedLink } from "@/db";
import { eq, desc, and, SQL } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

// GET /api/v1/news/curated - List curated links
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const conditions: SQL[] = [];

  if (category) {
    conditions.push(eq(curatedLinks.category, category));
  }
  if (featured === "true") {
    conditions.push(eq(curatedLinks.featured, true));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select()
    .from(curatedLinks)
    .where(whereClause)
    .orderBy(desc(curatedLinks.date))
    .limit(limit)
    .offset(offset);

  return Response.json({
    data,
    meta: { limit, offset },
  });
}

// POST /api/v1/news/curated - Add a curated link
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "news:write");
  if (auth instanceof Response) return auth;

  try {
    const body = (await request.json()) as NewCuratedLink;

    // Validate required fields
    if (!body.title || !body.url || !body.source || !body.date || !body.category) {
      return Response.json(
        { error: "Missing required fields: title, url, source, date, category" },
        { status: 400 }
      );
    }

    const [newLink] = await db
      .insert(curatedLinks)
      .values({
        ...body,
        date: new Date(body.date),
      })
      .returning();

    return Response.json({ data: newLink }, { status: 201 });
  } catch (error) {
    console.error("Failed to create curated link:", error);
    return Response.json(
      { error: "Failed to create curated link" },
      { status: 500 }
    );
  }
}
