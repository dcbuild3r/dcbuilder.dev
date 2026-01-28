import { NextResponse } from "next/server";
import { getJobApplyClicksLast7Days, determineHotJobs } from "@/lib/posthog-api";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const clicks = await getJobApplyClicksLast7Days();
    const hotJobIds = determineHotJobs(clicks, 5); // Top 5% by clicks

    return NextResponse.json({
      hotJobIds,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch hot jobs:", error);
    return NextResponse.json(
      { hotJobIds: [], error: "Failed to fetch" },
      { status: 500 }
    );
  }
}
