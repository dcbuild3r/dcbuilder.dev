import { describe, expect, test } from "bun:test";
import { computeViewTotals, dedupeNewsletterTypes } from "../src/lib/newsletter-utils";

describe("newsletter helpers", () => {
  test("dedupes and validates newsletter types", () => {
    const types = dedupeNewsletterTypes(["jobs", "news", "jobs", "invalid", "candidates"]);
    expect(types).toEqual(["jobs", "news", "candidates"]);
  });

  test("computes totals and period delta", () => {
    expect(computeViewTotals(120, 80)).toEqual({ totalViews: 120, deltaViews: 40 });
    expect(computeViewTotals(12, 20)).toEqual({ totalViews: 12, deltaViews: -8 });
  });
});
