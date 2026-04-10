import { describe, expect, test } from "bun:test";
import { isTestLikeValue } from "../src/lib/test-data-cleanup";

describe("isTestLikeValue", () => {
  test("matches seeded and obvious QA/demo values", () => {
    expect(isTestLikeValue("test-job-1")).toBe(true);
    expect(isTestLikeValue("Test Company Alpha")).toBe(true);
    expect(isTestLikeValue("Demo newsletter campaign")).toBe(true);
    expect(isTestLikeValue("alice@test.example.com")).toBe(true);
    expect(isTestLikeValue("reader@example.com")).toBe(true);
    expect(isTestLikeValue("https://alpha.example.com/careers/test")).toBe(true);
    expect(isTestLikeValue("qa-news-import")).toBe(true);
  });

  test("does not match ordinary production-looking values", () => {
    expect(isTestLikeValue("Paradigm")).toBe(false);
    expect(isTestLikeValue("https://dcbuilder.dev/news")).toBe(false);
    expect(isTestLikeValue("admin-news-studio")).toBe(false);
    expect(isTestLikeValue("Weekly News Digest")).toBe(false);
  });
});
