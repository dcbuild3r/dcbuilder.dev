import { describe, expect, test } from "bun:test";
import net from "node:net";
import {
  createPreferredPostgresSocket,
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

describe("createPreferredPostgresSocket", () => {
  test("aborts a connection that never settles", async () => {
    const socket = new net.Socket();
    socket.connect = (() => socket) as typeof socket.connect;
    let destroyed = false;
    socket.destroy = (() => {
      destroyed = true;
      return socket;
    }) as typeof socket.destroy;

    const connection = createPreferredPostgresSocket(
      "postgresql://user:pass@db.example.com:5432/app",
      async () => [{ address: "203.0.113.1", family: 4 }],
      { timeoutMs: 20, socketFactory: () => socket }
    );

    await expect(connection).rejects.toMatchObject({ code: "ETIMEDOUT" });
    expect(destroyed).toBe(true);
  });
});

describe("getPostgresClientOptions", () => {
  test("uses a preferred socket for hosted database URLs", () => {
    const result = getPostgresClientOptions(
      "postgresql://user:pass@db.example.com:5432/app"
    );

    expect(result.socket).toBeFunction();
  });

  test("leaves localhost connections on the default client path", () => {
    const result = getPostgresClientOptions(
      "postgresql://user:pass@127.0.0.1:5432/app"
    );

    expect(result.socket).toBeUndefined();
  });
});
