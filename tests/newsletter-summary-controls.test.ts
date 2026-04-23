import { describe, expect, test } from "bun:test";
import {
  NEWSLETTER_TIMEFRAME_PRESETS,
  resolveNewsletterSummaryFilters,
  validateMinimumRelevance,
  validatePeriodDays,
} from "../src/lib/newsletter-summary";

describe("newsletter summary controls", () => {
  test("resolves built-in presets to fixed period and minimum relevance values", () => {
    expect(resolveNewsletterSummaryFilters({ timeframePreset: "weekly" })).toEqual({
      timeframePreset: "weekly",
      periodDays: 7,
      minimumRelevance: 1,
    });

    expect(resolveNewsletterSummaryFilters({ timeframePreset: "monthly" })).toEqual({
      timeframePreset: "monthly",
      periodDays: 30,
      minimumRelevance: 5,
    });

    expect(resolveNewsletterSummaryFilters({ timeframePreset: "quarterly" })).toEqual({
      timeframePreset: "quarterly",
      periodDays: 90,
      minimumRelevance: 7,
    });
  });

  test("supports custom ranges and custom minimum relevance", () => {
    expect(
      resolveNewsletterSummaryFilters({
        timeframePreset: "custom",
        periodDays: 45,
        minimumRelevance: 8,
      })
    ).toEqual({
      timeframePreset: "custom",
      periodDays: 45,
      minimumRelevance: 8,
    });
  });

  test("validates manual numeric limits", () => {
    expect(validatePeriodDays(1)).toEqual({ ok: true as const, data: 1 });
    expect(validatePeriodDays(365)).toEqual({ ok: true as const, data: 365 });
    expect(validatePeriodDays(366)).toEqual({
      ok: false as const,
      status: 400,
      error: "periodDays must be an integer between 1 and 365",
    });

    expect(validateMinimumRelevance(1)).toEqual({ ok: true as const, data: 1 });
    expect(validateMinimumRelevance(10)).toEqual({ ok: true as const, data: 10 });
    expect(validateMinimumRelevance(0)).toEqual({
      ok: false as const,
      status: 400,
      error: "minimumRelevance must be an integer between 1 and 10",
    });
  });

  test("exposes preset metadata for studio controls", () => {
    expect(NEWSLETTER_TIMEFRAME_PRESETS.weekly).toEqual({ periodDays: 7, minimumRelevance: 1 });
    expect(NEWSLETTER_TIMEFRAME_PRESETS.monthly).toEqual({ periodDays: 30, minimumRelevance: 5 });
    expect(NEWSLETTER_TIMEFRAME_PRESETS.quarterly).toEqual({ periodDays: 90, minimumRelevance: 7 });
  });
});
