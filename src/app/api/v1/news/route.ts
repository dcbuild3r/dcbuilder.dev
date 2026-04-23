import { NextRequest } from "next/server";
import { parsePaginationParams } from "@/services/auth";
import { listAnnouncementsCompat, listCuratedLinksCompat } from "@/lib/editorial-read-compat";
import { compareNewsByDateAndRelevance } from "@/lib/news-sorting";

// GET /api/v1/news - Get all news (curated links + announcements) combined
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const { limit } = parsePaginationParams(searchParams, { limit: 50, maxLimit: 200 });

  try {
    const [curated, announce] = await Promise.all([
      listCuratedLinksCompat({ limit, offset: 0 }),
      listAnnouncementsCompat({ limit, offset: 0 }),
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
