export type NewsletterStudioMode = "compose" | "queue" | "subscribers" | "templates";
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

  if (timeframePreset !== "custom") {
    const defaults = NEWSLETTER_SUMMARY_PRESET_DEFAULTS[timeframePreset];
    return {
      timeframePreset,
      periodDays: defaults.periodDays,
      minimumRelevance: defaults.minimumRelevance,
    };
  }

  const periodDays = input.periodDays ?? 7;
  const minimumRelevance = input.minimumRelevance ?? 1;

  return {
    timeframePreset,
    periodDays,
    minimumRelevance,
  };
}
