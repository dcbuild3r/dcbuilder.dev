import { afterEach, describe, expect, mock, test } from "bun:test";
import { dbTableExportPlaceholders } from "./helpers/db-module-mock";

const dbModulePath = new URL("../src/db/index.ts", import.meta.url).pathname;

function installDbMock() {
  const apiKeys = { id: "api_keys.id", key: "api_keys.key" };
  const rows = [{ id: "key_1", key: "scoped-key", name: "Scoped", permissions: ["agent:read"] }];
  const dbModule = () => ({
    ...dbTableExportPlaceholders,
    apiKeys,
    db: {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => rows,
          }),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => ({ execute: async () => undefined }),
        }),
      }),
    },
  });
  mock.module("@/db", dbModule);
  mock.module(dbModulePath, dbModule);
  return rows;
}

function request(headers: Record<string, string> = {}) {
  return new Request("https://dcbuilder.dev/api/v1/jobs", { headers }) as never;
}

describe("requireAuth", () => {
  afterEach(() => {
    mock.restore();
  });

  test("returns 401 when the key is missing", async () => {
    installDbMock();
    const { requireAuth } = await import("../src/services/auth");

    const result = await requireAuth(request(), "jobs:write");

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
  });

  test("returns 401 when the key is unknown", async () => {
    installDbMock().length = 0;
    const { requireAuth } = await import("../src/services/auth");

    const result = await requireAuth(request({ "x-api-key": "nope" }), "jobs:write");

    expect((result as Response).status).toBe(401);
  });

  test("returns 403 when a valid key lacks the permission", async () => {
    installDbMock();
    const { requireAuth } = await import("../src/services/auth");

    const result = await requireAuth(request({ "x-api-key": "scoped-key" }), "jobs:write");

    expect((result as Response).status).toBe(403);
    expect(await (result as Response).json()).toEqual({ error: "Insufficient permissions" });
  });

  test("passes a valid key with the permission", async () => {
    installDbMock();
    const { requireAuth } = await import("../src/services/auth");

    const result = await requireAuth(request({ authorization: "Bearer scoped-key" }), "agent:read");

    expect(result).toEqual({ valid: true, keyId: "key_1", name: "Scoped", permissions: ["agent:read"] });
  });
});
