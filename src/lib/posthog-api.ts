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

export interface SiteStats {
  pageviews7d: number | null;
  pageviews30d: number | null;
  uniqueVisitors7d: number | null;
  uniqueVisitors30d: number | null;
}

// Result type that distinguishes errors from empty data
export type PostHogResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; configured: boolean };

// Check if PostHog is configured
export function isPostHogConfigured(): boolean {
  return Boolean(POSTHOG_API_KEY && POSTHOG_PROJECT_ID);
}

async function fetchPostHogTrend(
  eventName: string,
  breakdownProperty: string
): Promise<PostHogResult<ClickCount[]>> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    console.warn("[posthog] API credentials not configured");
    return { success: false, error: "PostHog not configured", configured: false };
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
      const errorText = await response.text();
      console.error("[posthog] API error:", { status: response.status, body: errorText });
      return { success: false, error: `PostHog API error: ${response.status}`, configured: true };
    }

    const data = await response.json();

    const result: ClickCount[] =
      data.result?.map((r: TrendResult) => ({
        id: r.breakdown_value,
        count: r.count,
      })) ?? [];

    return { success: true, data: result };
  } catch (error) {
    console.error("[posthog] Failed to fetch data:", error);
    return { success: false, error: "Failed to connect to PostHog", configured: true };
  }
}

// Job analytics
export async function getJobApplyClicksLast7Days(): Promise<PostHogResult<ClickCount[]>> {
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
export async function getCandidateViewsLast7Days(): Promise<PostHogResult<ClickCount[]>> {
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

// News analytics
export async function getNewsClicksLast7Days(): Promise<PostHogResult<ClickCount[]>> {
  return fetchPostHogTrend("news_click", "news_id");
}

// Blog analytics - track by slug from $pageview on /blog/* paths
export async function getBlogViewsLast7Days(): Promise<PostHogResult<ClickCount[]>> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    console.warn("[posthog] API credentials not configured");
    return { success: false, error: "PostHog not configured", configured: false };
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
          events: [{ id: "$pageview", type: "events" }],
          date_from: "-7d",
          breakdown: "$pathname",
          breakdown_type: "event",
          properties: [
            {
              key: "$pathname",
              value: "^/blog/[^/]+$",
              operator: "regex",
              type: "event",
            },
          ],
        }),
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[posthog] Blog views API error:", { status: response.status, body: errorText });
      return { success: false, error: `PostHog API error: ${response.status}`, configured: true };
    }

    const data = await response.json();

    // Extract slug from pathname (e.g., "/blog/my-post" -> "my-post")
    const result: ClickCount[] =
      data.result
        ?.map((r: TrendResult) => {
          const match = r.breakdown_value.match(/^\/blog\/(.+)$/);
          return match
            ? { id: match[1], count: r.count }
            : null;
        })
        .filter((r: ClickCount | null): r is ClickCount => r !== null) ?? [];

    return { success: true, data: result };
  } catch (error) {
    console.error("[posthog] Failed to fetch blog views:", error);
    return { success: false, error: "Failed to connect to PostHog", configured: true };
  }
}

export function determineHotNews(
  clicks: ClickCount[],
  topN: number = 5
): string[] {
  if (clicks.length === 0) return [];

  // Sort by count descending
  const sorted = [...clicks].sort((a, b) => b.count - a.count);

  // Take top N with at least 1 click
  return sorted
    .slice(0, topN)
    .filter((c) => c.count > 0)
    .map((c) => c.id);
}

// Site-wide analytics
export async function getSiteStats(): Promise<SiteStats> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    console.warn("[posthog] API credentials not configured");
    return { pageviews7d: null, pageviews30d: null, uniqueVisitors7d: null, uniqueVisitors30d: null };
  }

  try {
    // Fetch pageviews and unique users for 7d and 30d
    const [res7d, res30d] = await Promise.all([
      fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/insights/trend/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${POSTHOG_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: [
            { id: "$pageview", type: "events", math: "total" },
            { id: "$pageview", type: "events", math: "dau" },
          ],
          date_from: "-7d",
        }),
        next: { revalidate: 3600 },
      }),
      fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/insights/trend/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${POSTHOG_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: [
            { id: "$pageview", type: "events", math: "total" },
            { id: "$pageview", type: "events", math: "dau" },
          ],
          date_from: "-30d",
        }),
        next: { revalidate: 3600 },
      }),
    ]);

    if (!res7d.ok || !res30d.ok) {
      console.error("[posthog] API error fetching site stats:", {
        res7dStatus: res7d.status,
        res30dStatus: res30d.status,
      });
      return { pageviews7d: null, pageviews30d: null, uniqueVisitors7d: null, uniqueVisitors30d: null };
    }

    const [data7d, data30d] = await Promise.all([res7d.json(), res30d.json()]);

    // Sum up the counts from each day
    const pageviews7d = data7d.result?.[0]?.count ?? 0;
    const uniqueVisitors7d = data7d.result?.[1]?.count ?? 0;
    const pageviews30d = data30d.result?.[0]?.count ?? 0;
    const uniqueVisitors30d = data30d.result?.[1]?.count ?? 0;

    return { pageviews7d, pageviews30d, uniqueVisitors7d, uniqueVisitors30d };
  } catch (error) {
    console.error("[posthog] Failed to fetch site stats:", error);
    return { pageviews7d: null, pageviews30d: null, uniqueVisitors7d: null, uniqueVisitors30d: null };
  }
}
