import { describe, expect, test } from "bun:test";
import {
  getPostgresClientOptions,
  resolveDatabaseUrl,
} from "../src/db/postgres-connection";

describe("resolveDatabaseUrl", () => {
  test("prefers DATABASE_URL when it is configured", () => {
    expect(
      resolveDatabaseUrl({
        DATABASE_URL: "postgresql://primary.example/app",
        DATABASE_URL_PROD: "postgresql://prod.example/app",
      })
    ).toBe("postgresql://primary.example/app");
  });

  test("falls back to DATABASE_URL_PROD for Vercel production runtime", () => {
    expect(
      resolveDatabaseUrl({
        VERCEL_ENV: "production",
        DATABASE_URL_PROD: "postgresql://prod.example/app",
      })
    ).toBe("postgresql://prod.example/app");
  });

  test("falls back to DATABASE_URL_STAGING for Vercel preview runtime", () => {
    expect(
      resolveDatabaseUrl({
        VERCEL_ENV: "preview",
        DATABASE_URL_STAGING: "postgresql://staging.example/app",
        DATABASE_URL_PROD: "postgresql://prod.example/app",
      })
    ).toBe("postgresql://staging.example/app");
  });

  test("fails with a clear message when no database URL is configured", () => {
    expect(() => resolveDatabaseUrl({})).toThrow(/DATABASE_URL/);
  });
});

describe("getPostgresClientOptions", () => {
  test("keeps localhost connections direct", () => {
    const options = getPostgresClientOptions("postgresql://user:pass@localhost:5432/app");

    expect(options).toEqual({});
  });

  test("uses the preferred socket helper for hosted postgres connections", () => {
    const options = getPostgresClientOptions("postgresql://user:pass@db.example.com:5432/app");

    expect(typeof options.socket).toBe("function");
  });

  test("keeps hosted runtime pools inside Supabase session pool limits", () => {
    const options = getPostgresClientOptions("postgresql://user:pass@db.example.com:5432/app");

    expect(options.max).toBe(2);
    expect(options.prepare).toBe(false);
  });
});
