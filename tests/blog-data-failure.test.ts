import { afterEach, describe, expect, mock, test } from "bun:test";
import { dbTableExportPlaceholders } from "./helpers/db-module-mock";

function createDatabaseError() {
  return new Error("database unavailable");
}

describe("blog data failures", () => {
  afterEach(() => {
    mock.restore();
  });

  test("does not turn a failed index read into an empty post list", async () => {
    mock.module("@/db", () => ({
      ...dbTableExportPlaceholders,
      blogPosts: {},
      db: {
        select: () => ({
          from: () => ({
            where: () => ({
              orderBy: async () => {
                throw createDatabaseError();
              },
            }),
          }),
        }),
      },
    }));

    const { getAllPosts } = await import(`../src/lib/blog?blog-failure-index=${Date.now()}`);

    await expect(getAllPosts()).rejects.toThrow("database unavailable");
  });

  test("does not turn a failed article read into a 404 result", async () => {
    mock.module("@/db", () => ({
      ...dbTableExportPlaceholders,
      blogPosts: {},
      db: {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => {
                throw createDatabaseError();
              },
            }),
          }),
        }),
      },
    }));

    const { getPostBySlug } = await import(`../src/lib/blog?blog-failure-article=${Date.now()}`);

    await expect(getPostBySlug("available-post")).rejects.toThrow("database unavailable");
  });
});
