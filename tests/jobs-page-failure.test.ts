import { afterEach, describe, expect, mock, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

describe("jobs page data failures", () => {
  afterEach(() => {
    mock.restore();
  });

  test("does not turn a failed jobs read into a valid empty board", async () => {
    mock.module("@/lib/data", () => ({
      getPublicJobsFromDB: async () => {
        throw new Error("database unavailable");
      },
      getPublicJobById: async () => null,
      getBaseUrl: () => "https://dcbuilder.dev",
      getJobRolesWithFallback: async () => [],
      getJobTagsWithFallback: async () => [],
    }));
    mock.module("@/lib/public-cache", () => ({
      cachePublicData: (
        _keyParts: readonly string[],
        loader: (...args: unknown[]) => Promise<unknown>,
      ) => loader,
    }));
    mock.module("@/components/Navbar", () => ({
      Navbar: () => createElement("nav"),
    }));
    mock.module("@/components/JobsGrid", () => ({
      JobsGrid: () => createElement("div", null, "0 jobs"),
    }));
    mock.module("@/components/icons/TelegramIcon", () => ({
      TelegramIcon: () => createElement("span"),
    }));

    const originalError = console.error;
    console.error = () => {};

    try {
      const { default: JobsPage } = await import(
        `../src/app/jobs/page?jobs-page-failure=${Date.now()}`
      );
      const markup = renderToStaticMarkup(await JobsPage());

      expect(markup).toContain("temporarily unavailable");
      expect(markup).not.toContain("0 jobs");
    } finally {
      console.error = originalError;
    }
  });
});
