import { describe, expect, test } from "bun:test";
import { resolvePreferredPostgresTarget } from "../src/db/postgres-connection";

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
