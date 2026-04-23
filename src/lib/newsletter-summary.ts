export type NewsletterTimeframePreset = "weekly" | "monthly" | "quarterly" | "custom";

export interface NewsletterSummaryFilters {
  timeframePreset: NewsletterTimeframePreset;
  periodDays: number;
  minimumRelevance: number;
}

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: 400; error: string };

export const NEWSLETTER_TIMEFRAME_PRESETS: Record<
  Exclude<NewsletterTimeframePreset, "custom">,
  { periodDays: number; minimumRelevance: number }
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

export function validateMinimumRelevance(value: unknown): ValidationResult<number> {
  const minimumRelevance = typeof value === "number" ? value : Number(value);

  if (
    !Number.isInteger(minimumRelevance) ||
    minimumRelevance < 1 ||
    minimumRelevance > 10
  ) {
    return {
      ok: false,
      status: 400,
      error: "Minimum relevance must be an integer between 1 and 10",
    };
  }

  return { ok: true, data: minimumRelevance };
}

export function validatePeriodDays(value: unknown): ValidationResult<number> {
  const periodDays = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(periodDays) || periodDays < 1 || periodDays > 365) {
    return {
      ok: false,
      status: 400,
      error: "Period days must be an integer between 1 and 365",
    };
  }

  return { ok: true, data: periodDays };
}

export function resolveNewsletterSummaryFilters(input: {
  timeframePreset: NewsletterTimeframePreset;
  periodDays?: number | null;
  minimumRelevance?: number | null;
}): NewsletterSummaryFilters {
  if (input.timeframePreset !== "custom") {
    const preset = NEWSLETTER_TIMEFRAME_PRESETS[input.timeframePreset];
    return {
      timeframePreset: input.timeframePreset,
      periodDays: preset.periodDays,
      minimumRelevance: input.minimumRelevance ?? preset.minimumRelevance,
    };
  }

  return {
    timeframePreset: "custom",
    periodDays: input.periodDays ?? NEWSLETTER_TIMEFRAME_PRESETS.weekly.periodDays,
    minimumRelevance: input.minimumRelevance ?? 1,
  };
}
