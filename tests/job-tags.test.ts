import { describe, expect, test } from "bun:test";
import { formatJobTagLabel, getJobTagLabel, normalizeJobTags } from "../src/lib/job-tags";

describe("job tag helpers", () => {
  test("normalizes database tag arrays before rendering", () => {
    expect(normalizeJobTags([" AI ", "", "Frontend", "ai", null, "  "])).toEqual([
      "ai",
      "frontend",
    ]);
  });

  test("falls back to a readable label for dynamic slugs", () => {
    expect(formatJobTagLabel("founders-office")).toBe("Founders Office");
    expect(getJobTagLabel("devrel", {})).toBe("Devrel");
  });

  test("ignores empty configured labels", () => {
    expect(getJobTagLabel("protocol-engineering", { "protocol-engineering": " " })).toBe(
      "Protocol Engineering",
    );
  });
});
