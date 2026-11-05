import { afterEach, expect, mock, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

afterEach(() => mock.restore());

test("a failed investment read shows an unavailable state instead of an empty portfolio", async () => {
  mock.module("@/db", () => ({
    db: { select: () => ({ from: () => ({
      orderBy: async () => { throw new Error("database unavailable"); },
      groupBy: async () => [],
    }) }) },
    investments: {}, jobs: {}, investmentCategories: {},
  }));
  mock.module("next/cache", () => ({ unstable_cache: (loader: unknown) => loader }));
  mock.module("@/lib/news", () => ({ getPublicAllNews: async () => [] }));
  mock.module("@/components/Navbar", () => ({ Navbar: () => createElement("nav") }));
  mock.module("@/components/PortfolioGrid", () => ({ PortfolioGrid: () => createElement("div", null, "Main (0)") }));
  const originalError = console.error;
  console.error = () => {};
  try {
    const { default: Portfolio } = await import("../src/app/portfolio/page");
    const markup = renderToStaticMarkup(await Portfolio());
    expect(markup).toContain("Investments are temporarily unavailable.");
    expect(markup).toContain("Try again");
    expect(markup).not.toContain("Main (0)");
  } finally {
    console.error = originalError;
  }
});
