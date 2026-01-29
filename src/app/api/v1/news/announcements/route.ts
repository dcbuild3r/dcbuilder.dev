import { NextRequest } from "next/server";
import { db, announcements, NewAnnouncement } from "@/db";
import { eq, desc, and, SQL } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

// GET /api/v1/news/announcements - List announcements
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company = searchParams.get("company");
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

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
    console.error("Failed to create announcement:", error);
    return Response.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
