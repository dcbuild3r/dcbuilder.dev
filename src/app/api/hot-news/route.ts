import { NextResponse } from "next/server";
import { getNewsClicksLast7Days, determineHotNews } from "@/services/posthog";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const result = await getNewsClicksLast7Days();

  if (!result.success) {
    // Return 503 Service Unavailable when analytics is down
    // Don't include hotNewsIds to force clients to handle the error
    return NextResponse.json(
      { error: result.error, configured: result.configured },
      { status: 503 }
    );
  }

  const hotNewsIds = determineHotNews(result.data, 5); // Top 5 by clicks
  const clickCounts: Record<string, number> = {};

  for (const item of result.data) {
    clickCounts[item.id] = item.count;
  }

  return NextResponse.json({
    hotNewsIds,
    clickCounts,
    updatedAt: new Date().toISOString(),
  });
}
