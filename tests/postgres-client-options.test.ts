import { describe, expect, test } from "bun:test";
import { getPostgresClientOptions } from "../src/db/postgres-connection";

describe("getPostgresClientOptions", () => {
  test("keeps localhost connections direct", () => {
    const options = getPostgresClientOptions("postgresql://user:pass@localhost:5432/app");

    expect(options).toEqual({});
  });

  test("uses the preferred socket helper for hosted postgres connections", () => {
    const options = getPostgresClientOptions("postgresql://user:pass@db.example.com:5432/app");

    expect(typeof options.socket).toBe("function");
  });
});
