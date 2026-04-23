import { describe, expect, test } from "bun:test";
import { getPostgresClientOptions } from "../src/db/postgres-connection";

describe("getPostgresClientOptions", () => {
  test("keeps localhost connections direct with a constrained pool", () => {
    const options = getPostgresClientOptions("postgresql://user:pass@localhost:5432/app");

    expect(options.socket).toBeUndefined();
    expect(options.max).toBe(1);
    expect(options.idle_timeout).toBe(20);
    expect(options.connect_timeout).toBe(10);
  });

  test("uses the preferred socket helper with a constrained pool for hosted postgres", () => {
    const options = getPostgresClientOptions("postgresql://user:pass@db.example.com:5432/app");

    expect(typeof options.socket).toBe("function");
    expect(options.max).toBe(1);
    expect(options.idle_timeout).toBe(20);
    expect(options.connect_timeout).toBe(10);
  });

  test("allows positive pool overrides from the environment", () => {
    process.env.POSTGRES_POOL_MAX = "2";
    process.env.POSTGRES_IDLE_TIMEOUT_SECONDS = "30";
    process.env.POSTGRES_CONNECT_TIMEOUT_SECONDS = "5";

    try {
      const options = getPostgresClientOptions("postgresql://user:pass@db.example.com:5432/app");

      expect(options.max).toBe(2);
      expect(options.idle_timeout).toBe(30);
      expect(options.connect_timeout).toBe(5);
    } finally {
      delete process.env.POSTGRES_POOL_MAX;
      delete process.env.POSTGRES_IDLE_TIMEOUT_SECONDS;
      delete process.env.POSTGRES_CONNECT_TIMEOUT_SECONDS;
    }
  });
});
