// Server-side only - uses POSTHOG_PERSONAL_API_KEY (not NEXT_PUBLIC)

const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com";

type ClickCount = {
  id: string;
  count: number;
};

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

// Use the new Query API (HogQL)
async function runHogQLQuery(query: string): Promise<{ results: unknown[][] } | null> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    console.warn("[posthog] API credentials not configured");
    return null;
  }

  try {
    const response = await fetch(
      `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${POSTHOG_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: {
            kind: "HogQLQuery",
            query,
          },
        }),
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[posthog] API error:", { status: response.status, body: errorText });
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[posthog] Failed to run query:", error);
    return null;
  }
}

// Job analytics - count job_apply_click events by job_id
export async function getJobApplyClicksLast7Days(): Promise<PostHogResult<ClickCount[]>> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    return { success: false, error: "PostHog not configured", configured: false };
  }

  const query = `
    SELECT
      properties.job_id as id,
      count() as count
    FROM events
    WHERE event = 'job_apply_click'
      AND timestamp > now() - INTERVAL 7 DAY
      AND properties.job_id IS NOT NULL
    GROUP BY properties.job_id
    ORDER BY count DESC
  `;

  const data = await runHogQLQuery(query);
  if (!data) {
    return { success: false, error: "Failed to query PostHog", configured: true };
  }

  const result: ClickCount[] = data.results.map((row) => ({
    id: String(row[0]),
    count: Number(row[1]),
  }));

  return { success: true, data: result };
}

export function determineHotJobs(
  clicks: ClickCount[],
  topPercentage: number = 5
): string[] {
  if (clicks.length === 0) return [];

  const sorted = [...clicks].sort((a, b) => b.count - a.count);
  const topCount = Math.max(1, Math.ceil(sorted.length * (topPercentage / 100)));

  return sorted
    .slice(0, topCount)
    .filter((c) => c.count > 0)
    .map((c) => c.id);
}

// Candidate analytics - count candidate_view events by candidate_id
export async function getCandidateViewsLast7Days(): Promise<PostHogResult<ClickCount[]>> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    return { success: false, error: "PostHog not configured", configured: false };
  }

  const query = `
    SELECT
      properties.candidate_id as id,
      count() as count
    FROM events
    WHERE event = 'candidate_view'
      AND timestamp > now() - INTERVAL 7 DAY
      AND properties.candidate_id IS NOT NULL
    GROUP BY properties.candidate_id
    ORDER BY count DESC
  `;

  const data = await runHogQLQuery(query);
  if (!data) {
    return { success: false, error: "Failed to query PostHog", configured: true };
  }

  const result: ClickCount[] = data.results.map((row) => ({
    id: String(row[0]),
    count: Number(row[1]),
  }));

  return { success: true, data: result };
}

export function determineHotCandidates(
  views: ClickCount[],
  topN: number = 3
): string[] {
  if (views.length === 0) return [];

  const sorted = [...views].sort((a, b) => b.count - a.count);

  return sorted
    .slice(0, topN)
    .filter((c) => c.count > 0)
    .map((c) => c.id);
}

// News analytics - count news_click events by news_id
export async function getNewsClicksLast7Days(): Promise<PostHogResult<ClickCount[]>> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    return { success: false, error: "PostHog not configured", configured: false };
  }

  const query = `
    SELECT
      properties.news_id as id,
      count() as count
    FROM events
    WHERE event = 'news_click'
      AND timestamp > now() - INTERVAL 7 DAY
      AND properties.news_id IS NOT NULL
    GROUP BY properties.news_id
    ORDER BY count DESC
  `;

  const data = await runHogQLQuery(query);
  if (!data) {
    return { success: false, error: "Failed to query PostHog", configured: true };
  }

  const result: ClickCount[] = data.results.map((row) => ({
    id: String(row[0]),
    count: Number(row[1]),
  }));

  return { success: true, data: result };
}

// Blog analytics - count pageviews on /blog/* paths
export async function getBlogViewsLast7Days(): Promise<PostHogResult<ClickCount[]>> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    return { success: false, error: "PostHog not configured", configured: false };
  }

  const query = `
    SELECT
      replaceRegexpOne(properties.$pathname, '^/blog/([^/]+)$', '\\\\1') as slug,
      count() as count
    FROM events
    WHERE event = '$pageview'
      AND timestamp > now() - INTERVAL 7 DAY
      AND properties.$pathname LIKE '/blog/%'
      AND properties.$pathname NOT LIKE '/blog/%/%'
    GROUP BY slug
    ORDER BY count DESC
  `;

  const data = await runHogQLQuery(query);
  if (!data) {
    return { success: false, error: "Failed to query PostHog", configured: true };
  }

  const result: ClickCount[] = data.results.map((row) => ({
    id: String(row[0]),
    count: Number(row[1]),
  }));

  return { success: true, data: result };
}

export function determineHotNews(
  clicks: ClickCount[],
  topN: number = 5
): string[] {
  if (clicks.length === 0) return [];

  const sorted = [...clicks].sort((a, b) => b.count - a.count);

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
    // Query for 7d stats
    const query7d = `
      SELECT
        count() as pageviews,
        count(DISTINCT properties.distinct_id) as unique_visitors
      FROM events
      WHERE event = '$pageview'
        AND timestamp > now() - INTERVAL 7 DAY
    `;

    // Query for 30d stats
    const query30d = `
      SELECT
        count() as pageviews,
        count(DISTINCT properties.distinct_id) as unique_visitors
      FROM events
      WHERE event = '$pageview'
        AND timestamp > now() - INTERVAL 30 DAY
    `;

    const [data7d, data30d] = await Promise.all([
      runHogQLQuery(query7d),
      runHogQLQuery(query30d),
    ]);

    const pageviews7d = data7d?.results?.[0]?.[0] as number | null;
    const uniqueVisitors7d = data7d?.results?.[0]?.[1] as number | null;
    const pageviews30d = data30d?.results?.[0]?.[0] as number | null;
    const uniqueVisitors30d = data30d?.results?.[0]?.[1] as number | null;

    return {
      pageviews7d: pageviews7d ?? null,
      pageviews30d: pageviews30d ?? null,
      uniqueVisitors7d: uniqueVisitors7d ?? null,
      uniqueVisitors30d: uniqueVisitors30d ?? null,
    };
  } catch (error) {
    console.error("[posthog] Failed to fetch site stats:", error);
    return { pageviews7d: null, pageviews30d: null, uniqueVisitors7d: null, uniqueVisitors30d: null };
  }
}
