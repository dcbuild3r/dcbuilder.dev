import { afterEach, describe, expect, mock, test } from "bun:test";

function createMissingColumnError(columnName: string) {
  const cause = new Error(`column "${columnName}" does not exist`) as Error & {
    code?: string;
  };
  cause.code = "42703";

  const error = new Error("Failed query") as Error & { cause?: Error; query?: string };
  error.cause = cause;
  error.query = `select "${columnName}" from "jobs"`;
  return error;
}

function createMissingRelationError(relationName: string) {
  const cause = new Error(`relation "${relationName}" does not exist`) as Error & {
    code?: string;
  };
  cause.code = "42P01";

  const error = new Error("Failed query") as Error & { cause?: Error; query?: string };
  error.cause = cause;
  error.query = `select * from "${relationName}"`;
  return error;
}

describe("jobs read compatibility", () => {
  afterEach(() => {
    mock.restore();
  });

  test("falls back to available jobs columns when optional columns are missing", async () => {
    const actualDb = await import("../src/db");
    let executeCall = 0;

    mock.module("@/db", () => ({
      ...actualDb,
      db: {
        select: () => ({
          from: () => ({
            $dynamic: () => ({
              orderBy: () => {
                throw createMissingColumnError("company_website");
              },
            }),
          }),
        }),
        execute: async () => {
          executeCall += 1;
          if (executeCall === 1) {
            return [
              { column_name: "id" },
              { column_name: "title" },
              { column_name: "company" },
              { column_name: "company_logo" },
              { column_name: "link" },
              { column_name: "location" },
              { column_name: "remote" },
              { column_name: "type" },
              { column_name: "category" },
              { column_name: "created_at" },
            ];
          }

          return [
            {
              id: "morpho-protocol-engineer",
              title: "Protocol Engineer",
              company: "Morpho",
              companyLogo: null,
              link: "https://example.com/morpho",
              location: "Remote",
              remote: "Remote",
              type: "full-time",
              salary: null,
              department: null,
              tags: [],
              category: "portfolio",
              featured: false,
              description: null,
              companyWebsite: null,
              companyX: null,
              companyGithub: null,
              createdAt: new Date("2026-05-26T00:00:00.000Z"),
              updatedAt: new Date("2026-05-26T00:00:00.000Z"),
            },
          ];
        },
      },
    }));

    const { getJobsFromDB } = await import(`../src/lib/data?jobs-compat=${Date.now()}`);
    const jobs = await getJobsFromDB();

    expect(jobs).toHaveLength(1);
    expect(jobs[0].company.name).toBe("Morpho");
    expect(jobs[0].link).toBe("https://example.com/morpho");
    expect(jobs[0].tags).toEqual([]);
  });

  test("job tag and role APIs fail open when metadata tables are unavailable", async () => {
    const actualDb = await import("../src/db");

    mock.module("@/db", () => ({
      ...actualDb,
      db: {
        select: () => ({
          from: () => ({
            orderBy: () => {
              throw createMissingRelationError("job_tags");
            },
          }),
        }),
      },
    }));

    const tagsRoute = await import(`../src/app/api/v1/job-tags/route?jobs-compat=${Date.now()}`);
    const tagsResponse = await tagsRoute.GET();
    expect(tagsResponse.status).toBe(200);
    expect(await tagsResponse.json()).toEqual([]);

    mock.restore();
    mock.module("@/db", () => ({
      ...actualDb,
      db: {
        select: () => ({
          from: () => ({
            orderBy: () => {
              throw createMissingRelationError("job_roles");
            },
          }),
        }),
      },
    }));

    const rolesRoute = await import(`../src/app/api/v1/job-roles/route?jobs-compat=${Date.now()}`);
    const rolesResponse = await rolesRoute.GET();
    expect(rolesResponse.status).toBe(200);
    expect(await rolesResponse.json()).toEqual([]);
  });
});
