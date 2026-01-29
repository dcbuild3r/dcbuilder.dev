import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  getJobApplyClicksLast7Days,
  getCandidateViewsLast7Days,
  getSiteStats,
} from "@/lib/posthog-api";

// GET /api/v1/admin/analytics - Get analytics data for admin
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "admin:read");
  if (auth instanceof Response) return auth;

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");

  try {
    if (type === "jobs") {
      const clicks = await getJobApplyClicksLast7Days();
      // Create a map of job_id -> click count
      const jobClicks: Record<string, number> = {};
      clicks.forEach(({ id, count }) => {
        jobClicks[id] = count;
      });
      return Response.json({ data: jobClicks });
    }

    if (type === "candidates") {
      const views = await getCandidateViewsLast7Days();
      // Create a map of candidate_id -> view count
      const candidateViews: Record<string, number> = {};
      views.forEach(({ id, count }) => {
        candidateViews[id] = count;
      });
      return Response.json({ data: candidateViews });
    }

    if (type === "site") {
      const siteStats = await getSiteStats();
      return Response.json({ data: siteStats });
    }

    // Return all analytics
    const [jobClicks, candidateViews, siteStats] = await Promise.all([
      getJobApplyClicksLast7Days(),
      getCandidateViewsLast7Days(),
      getSiteStats(),
    ]);

    const jobClicksMap: Record<string, number> = {};
    jobClicks.forEach(({ id, count }) => {
      jobClicksMap[id] = count;
    });

    const candidateViewsMap: Record<string, number> = {};
    candidateViews.forEach(({ id, count }) => {
      candidateViewsMap[id] = count;
    });

    return Response.json({
      data: {
        jobClicks: jobClicksMap,
        candidateViews: candidateViewsMap,
        siteStats,
      },
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return Response.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
