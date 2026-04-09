import { describe, expect, test } from "bun:test";
import {
  NEWSLETTER_STARTER_RENDERED_PANEL_CLASSNAME,
  NEWSLETTER_SUMMARY_PRESET_DEFAULTS,
  canAutoRenderComposePreview,
  getNewsletterStarterHeadingClassName,
  nextAvailabilityErrorAfterSubscribersRefresh,
  resolveNewsletterSummaryControls,
  shouldLoadSubscribersOnModeChange,
} from "../src/lib/newsletter-studio";

describe("canAutoRenderComposePreview", () => {
  test("waits for the studio data load to finish before auto-rendering preview", () => {
    expect(
      canAutoRenderComposePreview({
        loading: true,
        mode: "compose",
        draft: { contentMode: "template", markdownContent: "", manualHtml: "", manualText: "" },
      })
    ).toBe(false);
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "compose",
        draft: { contentMode: "template", markdownContent: "", manualHtml: "", manualText: "" },
      })
    ).toBe(true);
  });

  test("does not auto-render preview outside compose mode", () => {
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "queue",
        draft: { contentMode: "template", markdownContent: "", manualHtml: "", manualText: "" },
      })
    ).toBe(false);
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "templates",
        draft: { contentMode: "template", markdownContent: "", manualHtml: "", manualText: "" },
      })
    ).toBe(false);
  });

  test("does not auto-render markdown preview until markdown content exists", () => {
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "compose",
        draft: { contentMode: "markdown", markdownContent: "", manualHtml: "", manualText: "" },
      })
    ).toBe(false);
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "compose",
        draft: { contentMode: "markdown", markdownContent: "## News digest", manualHtml: "", manualText: "" },
      })
    ).toBe(true);
  });

  test("does not auto-render manual preview until html and text both exist", () => {
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "compose",
        draft: { contentMode: "manual", markdownContent: "", manualHtml: "<p>Hello</p>", manualText: "" },
      })
    ).toBe(false);
    expect(
      canAutoRenderComposePreview({
        loading: false,
        mode: "compose",
        draft: { contentMode: "manual", markdownContent: "", manualHtml: "<p>Hello</p>", manualText: "Hello" },
      })
    ).toBe(true);
  });

  test("styles the rendered starter preview with a left gutter and section separators", () => {
    expect(NEWSLETTER_STARTER_RENDERED_PANEL_CLASSNAME).toContain("max-w-3xl");
    expect(NEWSLETTER_STARTER_RENDERED_PANEL_CLASSNAME).toContain("px-4");
    expect(NEWSLETTER_STARTER_RENDERED_PANEL_CLASSNAME).toContain("sm:px-6");
    expect(NEWSLETTER_STARTER_RENDERED_PANEL_CLASSNAME).toContain("lg:px-8");
    expect(getNewsletterStarterHeadingClassName(2)).toContain("border-b");
    expect(getNewsletterStarterHeadingClassName(2)).toContain("pb-4");
  });

  test("loads subscribers only when entering the subscribers mode without cached data", () => {
    expect(
      shouldLoadSubscribersOnModeChange({
        nextMode: "subscribers",
        subscribersLoaded: false,
        subscribersLoading: false,
      })
    ).toBe(true);

    expect(
      shouldLoadSubscribersOnModeChange({
        nextMode: "subscribers",
        subscribersLoaded: true,
        subscribersLoading: false,
      })
    ).toBe(false);

    expect(
      shouldLoadSubscribersOnModeChange({
        nextMode: "subscribers",
        subscribersLoaded: false,
        subscribersLoading: true,
      })
    ).toBe(false);

    expect(
      shouldLoadSubscribersOnModeChange({
        nextMode: "queue",
        subscribersLoaded: false,
        subscribersLoading: false,
      })
    ).toBe(false);
  });

  test("clears a stale availability lock after subscriber refresh succeeds", () => {
    expect(
      nextAvailabilityErrorAfterSubscribersRefresh({
        previousAvailabilityError: "Newsletter database is temporarily unavailable.",
        subscriberAvailabilityReason: null,
      })
    ).toBe(null);

    expect(
      nextAvailabilityErrorAfterSubscribersRefresh({
        previousAvailabilityError: "Newsletter database is temporarily unavailable.",
        subscriberAvailabilityReason: "Newsletter database is temporarily unavailable.",
      })
    ).toBe("Newsletter database is temporarily unavailable.");
  });

  test("resolves preset summary controls with quarterly defaults and custom overrides", () => {
    expect(resolveNewsletterSummaryControls({ timeframePreset: "quarterly" })).toEqual({
      timeframePreset: "quarterly",
      periodDays: NEWSLETTER_SUMMARY_PRESET_DEFAULTS.quarterly.periodDays,
      minimumRelevance: NEWSLETTER_SUMMARY_PRESET_DEFAULTS.quarterly.minimumRelevance,
    });

    expect(
      resolveNewsletterSummaryControls({
        timeframePreset: "custom",
        periodDays: 45,
        minimumRelevance: 8,
      })
    ).toEqual({
      timeframePreset: "custom",
      periodDays: 45,
      minimumRelevance: 8,
    });

    expect(resolveNewsletterSummaryControls({ periodDays: 30 })).toEqual({
      timeframePreset: "monthly",
      periodDays: NEWSLETTER_SUMMARY_PRESET_DEFAULTS.monthly.periodDays,
      minimumRelevance: NEWSLETTER_SUMMARY_PRESET_DEFAULTS.monthly.minimumRelevance,
    });
  });
});
