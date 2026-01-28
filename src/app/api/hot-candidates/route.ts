import { NextResponse } from "next/server";
import { getCandidateViewsLast7Days, determineHotCandidates } from "@/lib/posthog-api";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const views = await getCandidateViewsLast7Days();
    const hotCandidateIds = determineHotCandidates(views, 3); // Top 3 by views

    return NextResponse.json({
      hotCandidateIds,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch hot candidates:", error);
    return NextResponse.json(
      { hotCandidateIds: [], error: "Failed to fetch" },
      { status: 500 }
    );
  }
}
