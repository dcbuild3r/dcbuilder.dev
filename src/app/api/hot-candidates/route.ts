import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db, candidates } from "@/db";
import { getCandidateViewsLast7Days, determineHotCandidates } from "@/services/posthog";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const result = await getCandidateViewsLast7Days();

  if (!result.success) {
    // Return 503 Service Unavailable when analytics is down
    // Don't include hotCandidateIds to force clients to handle the error
    return NextResponse.json(
      { error: result.error, configured: result.configured },
      { status: 503 }
    );
  }

  const hotCandidateIds = determineHotCandidates(result.data, 3); // Top 3 by views

  if (hotCandidateIds.length === 0) {
    return NextResponse.json({
      hotCandidateIds,
      updatedAt: new Date().toISOString(),
    });
  }

  let hotCandidates: Array<{ id: string; availability: string | null }>;
  try {
    hotCandidates = await db
      .select({
        id: candidates.id,
        availability: candidates.availability,
      })
      .from(candidates)
      .where(inArray(candidates.id, hotCandidateIds));
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Candidate availability unavailable",
        operation: "hot-candidates.availability",
        error: error instanceof Error ? error.message : String(error),
      })
    );
    hotCandidates = [];
  }

  const availableHotCandidateIds = new Set(
    hotCandidates
      .filter((candidate) => candidate.availability !== "not-looking")
      .map((candidate) => candidate.id)
  );

  return NextResponse.json({
    hotCandidateIds: hotCandidateIds.filter((id) => availableHotCandidateIds.has(id)),
    updatedAt: new Date().toISOString(),
  });
}
