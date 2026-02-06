import { describe, expect, test } from "bun:test";
import { FRESH_WINDOW_DAYS, getFreshCutoff, shouldBeFresh } from "../src/services/news-freshness";

describe("news freshness lifecycle", () => {
  test("uses a strict 7-day freshness window", () => {
    expect(FRESH_WINDOW_DAYS).toBe(7);
  });

  test("marks items newer than 7 days as fresh", () => {
    const now = new Date("2026-02-06T12:00:00.000Z");
    const justInsideWindow = new Date("2026-01-30T12:00:00.001Z");

    expect(shouldBeFresh(justInsideWindow, now)).toBe(true);
  });

  test("marks items exactly 7 days old as stale", () => {
    const now = new Date("2026-02-06T12:00:00.000Z");
    const exactBoundary = new Date("2026-01-30T12:00:00.000Z");

    expect(shouldBeFresh(exactBoundary, now)).toBe(false);
  });

  test("matches cutoff helper behavior", () => {
    const now = new Date("2026-02-06T12:00:00.000Z");
    const cutoff = getFreshCutoff(now);

    expect(cutoff.toISOString()).toBe("2026-01-30T12:00:00.000Z");
    expect(shouldBeFresh(new Date("2026-01-31T00:00:00.000Z"), now)).toBe(true);
    expect(shouldBeFresh(new Date("2026-01-29T23:59:59.999Z"), now)).toBe(false);
  });
});
