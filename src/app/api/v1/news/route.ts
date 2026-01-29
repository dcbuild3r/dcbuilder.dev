import { NextRequest } from "next/server";
import { db, curatedLinks, announcements } from "@/db";
import { desc } from "drizzle-orm";
import { parsePaginationParams } from "@/lib/api-auth";

// GET /api/v1/news - Get all news (curated links + announcements) combined
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const { limit } = parsePaginationParams(searchParams, { limit: 50, maxLimit: 200 });

  try {
    const [curated, announce] = await Promise.all([
      db
        .select()
        .from(curatedLinks)
        .orderBy(desc(curatedLinks.date))
        .limit(limit),
      db
        .select()
        .from(announcements)
        .orderBy(desc(announcements.date))
        .limit(limit),
    ]);

    // Transform and combine
    const curatedItems = curated.map((item) => ({
      ...item,
      type: "curated" as const,
    }));

    const announcementItems = announce.map((item) => ({
      ...item,
      type: "announcement" as const,
    }));

    // Combine and sort by date
    const combined = [...curatedItems, ...announcementItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return Response.json({
      data: combined.slice(0, limit),
      meta: {
        total: combined.length,
        curatedCount: curated.length,
        announcementsCount: announce.length,
      },
    });
  } catch (error) {
    console.error("[api/news] GET failed:", error);
    return Response.json(
      { error: "Failed to fetch news", code: "DB_QUERY_ERROR" },
      { status: 500 }
    );
  }
}
