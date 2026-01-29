import { NextRequest } from "next/server";
import { db, curatedLinks, announcements } from "@/db";
import { desc } from "drizzle-orm";

// GET /api/v1/news - Get all news (curated links + announcements) combined
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "50");

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
}
