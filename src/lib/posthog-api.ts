// Server-side only - uses POSTHOG_PERSONAL_API_KEY (not NEXT_PUBLIC)

const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const POSTHOG_HOST = "https://us.posthog.com";

type ApplyClickCount = {
  job_id: string;
  count: number;
};

export async function getJobApplyClicksLast7Days(): Promise<ApplyClickCount[]> {
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
          events: [{ id: "job_apply_click", type: "events" }],
          date_from: "-7d",
          breakdown: "job_id",
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

    // Parse the results - PostHog returns breakdown values with counts
    interface TrendResult {
      breakdown_value: string;
      count: number;
    }

    return (
      data.result?.map((r: TrendResult) => ({
        job_id: r.breakdown_value,
        count: r.count,
      })) ?? []
    );
  } catch (error) {
    console.error("Failed to fetch PostHog data:", error);
    return [];
  }
}

export function determineHotJobs(
  clicks: ApplyClickCount[],
  threshold: number = 10
): string[] {
  // Jobs with >= threshold clicks in last 7 days are "hot"
  return clicks.filter((c) => c.count >= threshold).map((c) => c.job_id);
}
