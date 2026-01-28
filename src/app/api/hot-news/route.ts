import { NextResponse } from "next/server";
import { getNewsClicksLast7Days, determineHotNews } from "@/lib/posthog-api";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const clicks = await getNewsClicksLast7Days();
    const hotNewsIds = determineHotNews(clicks, 5); // Top 5 by clicks

    return NextResponse.json({
      hotNewsIds,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch hot news:", error);
    return NextResponse.json(
      { hotNewsIds: [], error: "Failed to fetch" },
      { status: 500 }
    );
  }
}
