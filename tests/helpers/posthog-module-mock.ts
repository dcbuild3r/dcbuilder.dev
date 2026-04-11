type ClickCount = {
  id: string;
  count: number;
};

type EmailClickRow = {
  email: string;
  count: number;
  lastClickedLink: string;
};

type SiteStats = {
  pageviews7d: number | null;
  pageviews30d: number | null;
  uniqueVisitors7d: number | null;
  uniqueVisitors30d: number | null;
};

const emptyClickResult = async () => ({
  success: true as const,
  data: [] as ClickCount[],
});

const emptyEmailClickResult = async () => ({
  success: true as const,
  data: [] as EmailClickRow[],
});

const emptySiteStats = async (): Promise<SiteStats> => ({
  pageviews7d: null,
  pageviews30d: null,
  uniqueVisitors7d: null,
  uniqueVisitors30d: null,
});

export function createPosthogModuleMock(overrides: Record<string, unknown> = {}) {
  return {
    isPostHogConfigured: () => false,
    getJobApplyClicksForWindow: emptyClickResult,
    getJobApplyClicksLast7Days: emptyClickResult,
    determineHotJobs: () => [] as string[],
    getCandidateViewsForWindow: emptyClickResult,
    getCandidateViewsLast7Days: emptyClickResult,
    determineHotCandidates: () => [] as string[],
    getNewsClicksForWindow: emptyClickResult,
    getNewsClicksLast7Days: emptyClickResult,
    determineHotNews: () => [] as string[],
    getBlogViewsLast7Days: emptyClickResult,
    getEmailClicksLast7Days: emptyEmailClickResult,
    getSiteStats: emptySiteStats,
    ...overrides,
  };
}
