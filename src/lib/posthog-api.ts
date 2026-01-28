// Server-side only - uses POSTHOG_PERSONAL_API_KEY (not NEXT_PUBLIC)

const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const POSTHOG_HOST = "https://us.posthog.com";

type ClickCount = {
  id: string;
  count: number;
};

interface TrendResult {
  breakdown_value: string;
  count: number;
}

async function fetchPostHogTrend(
  eventName: string,
  breakdownProperty: string
): Promise<ClickCount[]> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    console.warn("PostHog API credentials not configured");
    return [];
  }

  try {
    const response = await fetch(
      `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/insights/trend/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${POSTHOG_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: [{ id: eventName, type: "events" }],
          date_from: "-7d",
          breakdown: breakdownProperty,
          breakdown_type: "event",
        }),
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      console.error("PostHog API error:", await response.text());
      return [];
    }

    const data = await response.json();

    return (
      data.result?.map((r: TrendResult) => ({
        id: r.breakdown_value,
        count: r.count,
      })) ?? []
    );
  } catch (error) {
    console.error("Failed to fetch PostHog data:", error);
    return [];
  }
}

// Job analytics
export async function getJobApplyClicksLast7Days(): Promise<ClickCount[]> {
  return fetchPostHogTrend("job_apply_click", "job_id");
}

export function determineHotJobs(
  clicks: ClickCount[],
  topPercentage: number = 5
): string[] {
  if (clicks.length === 0) return [];

  // Sort by count descending
  const sorted = [...clicks].sort((a, b) => b.count - a.count);

  // Take top X% (minimum 1)
  const topCount = Math.max(1, Math.ceil(sorted.length * (topPercentage / 100)));

  // Only include jobs with at least 1 click
  return sorted
    .slice(0, topCount)
    .filter((c) => c.count > 0)
    .map((c) => c.id);
}

// Candidate analytics
export async function getCandidateViewsLast7Days(): Promise<ClickCount[]> {
  return fetchPostHogTrend("candidate_view", "candidate_id");
}

export function determineHotCandidates(
  views: ClickCount[],
  topN: number = 3
): string[] {
  if (views.length === 0) return [];

  // Sort by count descending
  const sorted = [...views].sort((a, b) => b.count - a.count);

  // Take top N with at least 1 view
  return sorted
    .slice(0, topN)
    .filter((c) => c.count > 0)
    .map((c) => c.id);
}
