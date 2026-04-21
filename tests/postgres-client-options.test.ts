import { describe, expect, test } from "bun:test";
import { buildPostgresClientOptions } from "../src/db/client-options";

describe("buildPostgresClientOptions", () => {
  test("keeps localhost connections direct", () => {
    const options = buildPostgresClientOptions("postgresql://user:pass@localhost:5432/app");

    expect(options).toEqual({});
  });

  test("uses the preferred socket helper for hosted postgres connections", () => {
    const options = buildPostgresClientOptions("postgresql://user:pass@db.example.com:5432/app");

    expect(typeof options.socket).toBe("function");
  });
});
