export const NEWSLETTER_TIMEFRAME_PRESETS = {
  weekly: { periodDays: 7, minimumRelevance: 1 },
  monthly: { periodDays: 30, minimumRelevance: 5 },
  quarterly: { periodDays: 90, minimumRelevance: 7 },
} as const;

export type NewsletterTimeframePreset = keyof typeof NEWSLETTER_TIMEFRAME_PRESETS | "custom";

type ValidationOk<T> = { ok: true; data: T };
type ValidationError = { ok: false; status: 400; error: string };

export function validatePeriodDays(periodDays?: number): ValidationOk<number> | ValidationError {
  if (periodDays === undefined) {
    return { ok: true, data: NEWSLETTER_TIMEFRAME_PRESETS.weekly.periodDays };
  }

  if (!Number.isInteger(periodDays) || periodDays < 1 || periodDays > 365) {
    return { ok: false, status: 400, error: "periodDays must be an integer between 1 and 365" };
  }

  return { ok: true, data: periodDays };
}

export function validateMinimumRelevance(minimumRelevance?: number): ValidationOk<number> | ValidationError {
  if (minimumRelevance === undefined) {
    return { ok: true, data: NEWSLETTER_TIMEFRAME_PRESETS.weekly.minimumRelevance };
  }

  if (!Number.isInteger(minimumRelevance) || minimumRelevance < 1 || minimumRelevance > 10) {
    return { ok: false, status: 400, error: "minimumRelevance must be an integer between 1 and 10" };
  }

  return { ok: true, data: minimumRelevance };
}

export function resolveNewsletterSummaryFilters(input: {
  timeframePreset?: NewsletterTimeframePreset;
  periodDays?: number;
  minimumRelevance?: number;
}) {
  const timeframePreset = input.timeframePreset ?? "weekly";
  if (timeframePreset !== "custom") {
    return {
      timeframePreset,
      periodDays: NEWSLETTER_TIMEFRAME_PRESETS[timeframePreset].periodDays,
      minimumRelevance: NEWSLETTER_TIMEFRAME_PRESETS[timeframePreset].minimumRelevance,
    };
  }

  const periodDays = validatePeriodDays(input.periodDays);
  if (!periodDays.ok) {
    throw new Error(periodDays.error);
  }

  const minimumRelevance = validateMinimumRelevance(input.minimumRelevance);
  if (!minimumRelevance.ok) {
    throw new Error(minimumRelevance.error);
  }

  return {
    timeframePreset,
    periodDays: periodDays.data,
    minimumRelevance: minimumRelevance.data,
  };
}
