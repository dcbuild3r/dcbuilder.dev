import { NextRequest } from "next/server";
import { requireAuth } from "@/services/auth";
import { db, jobs } from "@/db";
import {
  getJobApplyClicksLast7Days,
  getCandidateViewsLast7Days,
  getBlogViewsLast7Days,
  getSiteStats,
  isPostHogConfigured,
} from "@/services/posthog";
import { inArray } from "drizzle-orm";

async function filterJobClicksToExistingJobs(jobClicks: Record<string, number>) {
  const ids = Object.keys(jobClicks);
  if (ids.length === 0) return jobClicks;

  // PostHog can contain stale job IDs (e.g. deleted jobs). Filter to current DB rows.
  const existing = await db.select({ id: jobs.id }).from(jobs).where(inArray(jobs.id, ids));
  const existingSet = new Set(existing.map((r) => r.id));

  const filtered: Record<string, number> = {};
  for (const [id, count] of Object.entries(jobClicks)) {
    if (existingSet.has(id)) filtered[id] = count;
  }
  return filtered;
}

// GET /api/v1/admin/analytics - Get analytics data for admin
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, "admin:read");
  if (auth instanceof Response) return auth;

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");

  // Check if PostHog is configured
  const configured = isPostHogConfigured();

  try {
    if (type === "jobs") {
      const result = await getJobApplyClicksLast7Days();
      if (!result.success) {
        return Response.json({
          data: {},
          error: result.error,
          configured: result.configured,
        });
      }
      const jobClicks: Record<string, number> = {};
      result.data.forEach(({ id, count }) => {
        jobClicks[id] = count;
      });
      const filtered = await filterJobClicksToExistingJobs(jobClicks);
      return Response.json({ data: filtered, configured });
    }

    if (type === "candidates") {
      const result = await getCandidateViewsLast7Days();
      if (!result.success) {
        return Response.json({
          data: {},
          error: result.error,
          configured: result.configured,
        });
      }
      const candidateViews: Record<string, number> = {};
      result.data.forEach(({ id, count }) => {
        candidateViews[id] = count;
      });
      return Response.json({ data: candidateViews, configured });
    }

    if (type === "site") {
      const siteStats = await getSiteStats();
      return Response.json({ data: siteStats, configured });
    }

    if (type === "blog") {
      const result = await getBlogViewsLast7Days();
      if (!result.success) {
        return Response.json({
          data: {},
          error: result.error,
          configured: result.configured,
        });
      }
      const blogViews: Record<string, number> = {};
      result.data.forEach(({ id, count }) => {
        blogViews[id] = count;
      });
      return Response.json({ data: blogViews, configured });
    }

    // Return all analytics
    const [jobResult, candidateResult, blogResult, siteStats] = await Promise.all([
      getJobApplyClicksLast7Days(),
      getCandidateViewsLast7Days(),
      getBlogViewsLast7Days(),
      getSiteStats(),
    ]);

    const jobClicksMap: Record<string, number> = {};
    if (jobResult.success) {
      jobResult.data.forEach(({ id, count }) => {
        jobClicksMap[id] = count;
      });
    }
    const filteredJobClicksMap = await filterJobClicksToExistingJobs(jobClicksMap);

    const candidateViewsMap: Record<string, number> = {};
    if (candidateResult.success) {
      candidateResult.data.forEach(({ id, count }) => {
        candidateViewsMap[id] = count;
      });
    }

    const blogViewsMap: Record<string, number> = {};
    if (blogResult.success) {
      blogResult.data.forEach(({ id, count }) => {
        blogViewsMap[id] = count;
      });
    }

    return Response.json({
      data: {
        jobClicks: filteredJobClicksMap,
        candidateViews: candidateViewsMap,
        blogViews: blogViewsMap,
        siteStats,
      },
      configured,
      errors: {
        jobs: jobResult.success ? null : jobResult.error,
        candidates: candidateResult.success ? null : candidateResult.error,
        blog: blogResult.success ? null : blogResult.error,
      },
    });
  } catch (error) {
    console.error("[api/admin/analytics] Failed to fetch:", error);
    return Response.json(
      { error: "Failed to fetch analytics", code: "ANALYTICS_ERROR" },
      { status: 500 }
    );
  }
}
