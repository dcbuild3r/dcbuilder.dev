import { NextRequest } from "next/server";
import { db, curatedLinks, announcements } from "@/db";
import { desc, sql } from "drizzle-orm";
import { parsePaginationParams } from "@/services/auth";
import { compareNewsByDateAndRelevance } from "@/lib/news-sorting";

// GET /api/v1/news - Get all news (curated links + announcements) combined
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const { limit } = parsePaginationParams(searchParams, { limit: 50, maxLimit: 200 });

  try {
    const [curated, announce] = await Promise.all([
      db
        .select()
        .from(curatedLinks)
        .orderBy(
          desc(sql`date_trunc('day', ${curatedLinks.date})`),
          desc(curatedLinks.relevance),
          desc(curatedLinks.date)
        )
        .limit(limit),
      db
        .select()
        .from(announcements)
        .orderBy(
          desc(sql`date_trunc('day', ${announcements.date})`),
          desc(announcements.relevance),
          desc(announcements.date)
        )
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

    const combined = [...curatedItems, ...announcementItems].sort(
      compareNewsByDateAndRelevance
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
