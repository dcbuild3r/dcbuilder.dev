import { afterEach, describe, expect, mock, test } from "bun:test";

const authModulePath = new URL("../src/services/auth.ts", import.meta.url).pathname;

function installAuthMock() {
  const authModule = () => ({
    requireAuth: async () => ({ valid: true as const, keyId: "key_1", name: "Admin", permissions: ["*"] }),
  });
  mock.module("@/services/auth", authModule);
  mock.module(authModulePath, authModule);
}

async function postFolder(folder: string) {
  const { POST } = await import("../src/app/api/upload/route");
  const form = new FormData();
  form.set("folder", folder);
  return POST(new Request("https://dcbuilder.dev/api/upload", { method: "POST", body: form }) as never);
}

describe("POST /api/upload folder validation", () => {
  afterEach(() => {
    mock.restore();
  });

  test.each(["../secrets", "/uploads", "uploads/../x", "Uploads", "a//b", "uploads/", "a".repeat(65), "with space"])(
    "rejects %s",
    async (folder) => {
      installAuthMock();
      const response = await postFolder(folder);
      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe("Invalid folder");
    },
  );

  test.each(["uploads", "companies", "candidates/avatars", "job_logos-2"])("accepts %s", async (folder) => {
    installAuthMock();
    const response = await postFolder(folder);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("No file provided");
  });
});
