import { describe, expect, test } from "bun:test";
import { assertSafeTestDataTarget, isTestLikeValue } from "../src/lib/test-data-cleanup";

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

describe("assertSafeTestDataTarget", () => {
  test("allows explicit test runs against local databases", () => {
    expect(() =>
      assertSafeTestDataTarget("postgresql://postgres:password@localhost:5432/dcbuilder_dev", "unit test", {
        TEST_MODE: "true",
      })
    ).not.toThrow();
  });

  test("requires explicit test mode or CI before seeding", () => {
    expect(() =>
      assertSafeTestDataTarget("postgresql://postgres:password@localhost:5432/dcbuilder_dev", "unit test", {})
    ).toThrow(/TEST_MODE=true/);
  });

  test("rejects production and non-local database targets", () => {
    const prodUrl = "postgresql://user:password@aws-1-eu-west-2.pooler.supabase.com:6543/postgres";

    expect(() =>
      assertSafeTestDataTarget(prodUrl, "unit test", {
        TEST_MODE: "true",
        DATABASE_URL_PROD: prodUrl,
      })
    ).toThrow(/DATABASE_URL_PROD/);

    expect(() =>
      assertSafeTestDataTarget("postgresql://user:password@db.example.com:5432/app", "unit test", {
        TEST_MODE: "true",
      })
    ).toThrow(/non-local database/);

    expect(() =>
      assertSafeTestDataTarget("postgresql://postgres:password@localhost:5432/dcbuilder_dev", "unit test", {
        TEST_MODE: "true",
        NODE_ENV: "production",
      })
    ).toThrow(/production environment/);
  });
});
