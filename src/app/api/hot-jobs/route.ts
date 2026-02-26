import { NextResponse } from "next/server";
import { getJobApplyClicksLast7Days, determineHotJobs } from "@/services/posthog";
import { db, jobs } from "@/db";
import { inArray } from "drizzle-orm";

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

  // PostHog can contain stale job IDs; filter to jobs that still exist.
  const ids = result.data.map((c) => c.id);
  const existing = ids.length
    ? await db.select({ id: jobs.id }).from(jobs).where(inArray(jobs.id, ids))
    : [];
  const existingSet = new Set(existing.map((r) => r.id));
  const filteredClicks = result.data.filter((c) => existingSet.has(c.id));

  const hotJobIds = determineHotJobs(filteredClicks, 5); // Top 5% by clicks

  return NextResponse.json({
    hotJobIds,
    updatedAt: new Date().toISOString(),
  });
}
