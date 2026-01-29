import { NextResponse } from "next/server";
import { getJobApplyClicksLast7Days, determineHotJobs } from "@/lib/posthog-api";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const result = await getJobApplyClicksLast7Days();

  if (!result.success) {
    // Return 503 Service Unavailable when analytics is down
    // Don't include hotJobIds to force clients to handle the error
    return NextResponse.json(
      { error: result.error, configured: result.configured },
      { status: 503 }
    );
  }

  const hotJobIds = determineHotJobs(result.data, 5); // Top 5% by clicks

  return NextResponse.json({
    hotJobIds,
    updatedAt: new Date().toISOString(),
  });
}
