import { afterEach, describe, expect, mock, test } from "bun:test";
import { dbTableExportPlaceholders } from "./helpers/db-module-mock";

const dbModulePath = new URL("../src/db/index.ts", import.meta.url).pathname;
const safeFetchModulePath = new URL("../src/lib/safe-fetch.ts", import.meta.url).pathname;
const STORED_LINK = "https://jobs.example.com/acme/engineer";

function installMocks(rows: Array<{ id: string }>) {
  const lookups: unknown[] = [];
  const jobs = { id: "jobs.id", link: "jobs.link" };
  const dbModule = () => ({
    ...dbTableExportPlaceholders,
    jobs,
    db: {
      select: () => ({
        from: () => ({
          where: (condition: unknown) => ({
            limit: async () => {
              lookups.push(condition);
              return rows;
            },
          }),
        }),
      }),
    },
  });
  mock.module("@/db", dbModule);
  mock.module(dbModulePath, dbModule);

  const safeFetchText = mock<(url: string) => Promise<{ ok: boolean; status: number; text: string }>>(async () => ({
    ok: true,
    status: 200,
    text: "<h2>About the role</h2><p>Build things.</p>",
  }));
  const safeFetchModule = () => ({ safeFetchText, UnsafeUrlError: class extends Error {} });
  mock.module("@/lib/safe-fetch", safeFetchModule);
  mock.module(safeFetchModulePath, safeFetchModule);

  return { lookups, safeFetchText };
}

function get(url: string) {
  return new Request(`https://dcbuilder.dev/api/job-description?url=${encodeURIComponent(url)}`) as never;
}

describe("GET /api/job-description", () => {
  afterEach(() => {
    mock.restore();
  });

  test("refuses URLs that are not a stored job link without fetching", async () => {
    const { lookups, safeFetchText } = installMocks([]);
    const { GET } = await import("../src/app/api/job-description/route");

    const response = await GET(get("https://169.254.169.254/latest/meta-data"));

    expect(response.status).toBe(404);
    expect(lookups).toHaveLength(1);
    expect(safeFetchText).not.toHaveBeenCalled();
  });

  test("fetches and extracts a stored job link", async () => {
    const { safeFetchText } = installMocks([{ id: "job_1" }]);
    const { GET } = await import("../src/app/api/job-description/route");

    const response = await GET(get(STORED_LINK));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(safeFetchText).toHaveBeenCalledTimes(1);
    expect(safeFetchText.mock.calls[0]?.[0]).toBe(STORED_LINK);
    expect(body.description).toBe("Build things.");
  });
});
