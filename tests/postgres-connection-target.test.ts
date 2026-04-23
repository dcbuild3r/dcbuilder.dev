import { describe, expect, test } from "bun:test";
import {
  getPostgresClientOptions,
  resolvePreferredPostgresTarget,
} from "../src/db/postgres-connection";

describe("resolvePreferredPostgresTarget", () => {
  test("prefers an IPv4 connect target while preserving the hostname for TLS", async () => {
    const result = await resolvePreferredPostgresTarget(
      "postgresql://user:pass@db.example.com:5432/app",
      async () => [{ address: "203.0.113.10", family: 4 }]
    );

    expect(result).toEqual({
      connectHost: "203.0.113.10",
      port: 5432,
      tlsServername: "db.example.com",
    });
  });
});

describe("getPostgresClientOptions", () => {
  test("uses a preferred socket for hosted database URLs", () => {
    const result = getPostgresClientOptions(
      "postgresql://user:pass@db.example.com:5432/app"
    );

    expect(result.socket).toBeFunction();
  });

  test("leaves localhost connections on the direct socket path with a constrained pool", () => {
    const result = getPostgresClientOptions(
      "postgresql://user:pass@127.0.0.1:5432/app"
    );

    expect(result.socket).toBeUndefined();
    expect(result.max).toBe(1);
    expect(result.idle_timeout).toBe(20);
    expect(result.connect_timeout).toBe(10);
  });
});
