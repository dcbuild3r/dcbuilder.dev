export type NewsletterStudioMode = "compose" | "queue" | "subscribers" | "templates";
export type NewsletterStudioNewsletterType = "news" | "jobs" | "candidates";
export type NewsletterSummaryTimeframePreset = "weekly" | "monthly" | "quarterly" | "custom";

export type NewsletterSummaryControls = {
  timeframePreset: NewsletterSummaryTimeframePreset;
  periodDays: number;
  minimumRelevance: number;
};

export const NEWSLETTER_SUMMARY_PRESET_DEFAULTS: Record<
  Exclude<NewsletterSummaryTimeframePreset, "custom">,
  Omit<NewsletterSummaryControls, "timeframePreset">
> = {
  weekly: {
    periodDays: 7,
    minimumRelevance: 1,
  },
  monthly: {
    periodDays: 30,
    minimumRelevance: 5,
  },
  quarterly: {
    periodDays: 90,
    minimumRelevance: 7,
  },
};

function inferNewsletterSummaryPreset(periodDays?: number | null): NewsletterSummaryTimeframePreset {
  if (periodDays === NEWSLETTER_SUMMARY_PRESET_DEFAULTS.weekly.periodDays) return "weekly";
  if (periodDays === NEWSLETTER_SUMMARY_PRESET_DEFAULTS.monthly.periodDays) return "monthly";
  if (periodDays === NEWSLETTER_SUMMARY_PRESET_DEFAULTS.quarterly.periodDays) return "quarterly";
  return "custom";
}

function computeUtcWindow(periodDays: number, now: Date) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (periodDays - 1));
  start.setUTCHours(0, 0, 0, 0);
  return { start, end };
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

export const NEWSLETTER_STARTER_RENDERED_PANEL_CLASSNAME = "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8";

export function getNewsletterStarterHeadingClassName(level: number) {
  if (level === 2) {
    return "mb-6 mt-0 border-b border-neutral-900 pb-4 text-4xl font-black tracking-tight text-neutral-950 dark:border-neutral-100 dark:text-neutral-50";
  }

  if (level === 3) {
    return "mb-4 mt-8 text-2xl font-bold tracking-tight text-neutral-950 dark:text-neutral-50";
  }

  return "text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50";
}

export function canAutoRenderComposePreview(input: {
  loading: boolean;
  mode: NewsletterStudioMode;
  draft: {
    contentMode: "template" | "markdown" | "manual";
    markdownContent: string;
    manualHtml: string;
    manualText: string;
  };
}) {
  if (input.loading || input.mode !== "compose") {
    return false;
  }

  if (input.draft.contentMode === "template") {
    return true;
  }

  if (input.draft.contentMode === "markdown") {
    return input.draft.markdownContent.trim().length > 0;
  }

  return input.draft.manualHtml.trim().length > 0 && input.draft.manualText.trim().length > 0;
}

export function shouldLoadSubscribersOnModeChange(input: {
  nextMode: NewsletterStudioMode;
  subscribersLoaded: boolean;
  subscribersLoading: boolean;
}) {
  return (
    input.nextMode === "subscribers" &&
    !input.subscribersLoaded &&
    !input.subscribersLoading
  );
}

export function nextAvailabilityErrorAfterSubscribersRefresh(input: {
  previousAvailabilityError: string | null;
  subscriberAvailabilityReason: string | null;
}) {
  return input.subscriberAvailabilityReason ?? null;
}

export function resolveNewsletterSummaryControls(input: {
  timeframePreset?: NewsletterSummaryTimeframePreset | null;
  periodDays?: number | null;
  minimumRelevance?: number | null;
}): NewsletterSummaryControls {
  const timeframePreset = input.timeframePreset ?? inferNewsletterSummaryPreset(input.periodDays);
  const presetMinimumRelevance = timeframePreset === "custom"
    ? 1
    : NEWSLETTER_SUMMARY_PRESET_DEFAULTS[timeframePreset].minimumRelevance;
  const minimumRelevance = input.minimumRelevance ?? presetMinimumRelevance;

  if (timeframePreset !== "custom") {
    const defaults = NEWSLETTER_SUMMARY_PRESET_DEFAULTS[timeframePreset];
    return {
      timeframePreset,
      periodDays: defaults.periodDays,
      minimumRelevance,
    };
  }

  const periodDays = input.periodDays ?? 7;

  return {
    timeframePreset,
    periodDays,
    minimumRelevance,
  };
}

export function getSuggestedNewsletterSubject(input: {
  newsletterType: NewsletterStudioNewsletterType;
  periodDays: number;
  timeframePreset?: NewsletterSummaryTimeframePreset | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const { start, end } = computeUtcWindow(input.periodDays, now);
  const timeframePreset = input.timeframePreset ?? inferNewsletterSummaryPreset(input.periodDays);

  let label: string;
  if (input.newsletterType === "news") {
    if (timeframePreset === "monthly") {
      label = "Monthly News Digest";
    } else if (timeframePreset === "quarterly") {
      label = "Quarterly News Digest";
    } else if (timeframePreset === "custom") {
      label = "News Digest";
    } else {
      label = "Weekly News Digest";
    }
  } else {
    label = `${input.newsletterType[0].toUpperCase()}${input.newsletterType.slice(1)} Digest`;
  }

  return `${label} (${isoDay(start)} to ${isoDay(end)})`;
}
