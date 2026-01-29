import { NextRequest } from "next/server";
import { db, announcements, NewAnnouncement } from "@/db";
import { eq, desc, and, SQL } from "drizzle-orm";
import { requireAuth, parsePaginationParams } from "@/lib/api-auth";

// GET /api/v1/news/announcements - List announcements
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company = searchParams.get("company");
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const { limit, offset } = parsePaginationParams(searchParams, { limit: 50, maxLimit: 200 });

  try {
    const conditions: SQL[] = [];

    if (company) {
      conditions.push(eq(announcements.company, company));
    }
    if (category) {
      conditions.push(eq(announcements.category, category));
    }
    if (featured === "true") {
      conditions.push(eq(announcements.featured, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(announcements)
      .where(whereClause)
      .orderBy(desc(announcements.date))
      .limit(limit)
      .offset(offset);

    return Response.json({
      data,
      meta: { limit, offset },
    });
  } catch (error) {
    console.error("[api/news/announcements] GET failed:", error);
    return Response.json(
      { error: "Failed to fetch announcements", code: "DB_QUERY_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v1/news/announcements - Add an announcement
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "news:write");
  if (auth instanceof Response) return auth;

  try {
    const body = (await request.json()) as NewAnnouncement;

    // Validate required fields
    if (
      !body.title ||
      !body.url ||
      !body.company ||
      !body.platform ||
      !body.date ||
      !body.category
    ) {
      return Response.json(
        {
          error:
            "Missing required fields: title, url, company, platform, date, category",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const [newAnnouncement] = await db
      .insert(announcements)
      .values({
        ...body,
        date: new Date(body.date),
      })
      .returning();

    return Response.json({ data: newAnnouncement }, { status: 201 });
  } catch (error) {
    console.error("[api/news/announcements] POST failed:", error);

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return Response.json(
        { error: "An announcement with this identifier already exists", code: "DUPLICATE_KEY" },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to create announcement", code: "DB_INSERT_ERROR" },
      { status: 500 }
    );
  }
}
