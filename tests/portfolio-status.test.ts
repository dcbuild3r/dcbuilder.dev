import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { InvestmentCard } from "@/components/InvestmentCard";
import { sortPortfolioInvestments } from "@/lib/portfolio-order";
import type { Investment, SortOption } from "@/types/investments";

function investment(title: string, status: string | null, overrides: Partial<Investment> = {}): Investment {
  return { title, status, tier: 4, featured: false, description: null, imageUrl: null, logo: null, ...overrides };
}

const portfolio = [
  investment("PIN AI", "defunct", { tier: 1, featured: true }),
  investment("Succinct", "exited", { tier: 2 }),
  investment("Knox", "defunct"),
  investment("Eclipse", "exited", { tier: 1, featured: true }),
  investment("Mode", "exited"),
  investment("Zenith", "active"),
  investment("Active featured", "active", { tier: 2, featured: true }),
  investment("Legacy", null),
];

describe("portfolio status ordering", () => {
  for (const sort of ["relevance", "alphabetical", "alphabetical-desc"] satisfies SortOption[]) {
    test(`${sort} keeps all active investments before exits and ceased operations last`, () => {
      const sorted = sortPortfolioInvestments(portfolio, sort, "all");
      expect(sorted.slice(0, 3).map(i => i.status ?? "active")).toEqual(["active", "active", "active"]);
      expect(sorted.slice(3, 6).map(i => i.status)).toEqual(["exited", "exited", "exited"]);
      expect(sorted.slice(6).map(i => i.status)).toEqual(["defunct", "defunct"]);
      expect(new Set(sorted)).toEqual(new Set(portfolio));
    });
  }

  test("alphabetical sorting applies within each status group", () => {
    expect(sortPortfolioInvestments(portfolio, "alphabetical", "all").map(i => i.title)).toEqual([
      "Active featured", "Legacy", "Zenith", "Eclipse", "Mode", "Succinct", "Knox", "PIN AI",
    ]);
    expect(sortPortfolioInvestments(portfolio, "alphabetical-desc", "all").map(i => i.title)).toEqual([
      "Zenith", "Legacy", "Active featured", "Succinct", "Mode", "Eclipse", "PIN AI", "Knox",
    ]);
  });

  test("relevance preserves featured priority and deterministic shuffling without mutating input", () => {
    const before = [...portfolio];
    const sorted = sortPortfolioInvestments(portfolio, "relevance", "all");
    expect(sorted[0].title).toBe("Active featured");
    expect(sortPortfolioInvestments(portfolio, "relevance", "all")).toEqual(sorted);
    expect(portfolio).toEqual(before);
  });

  test("filtered subsets and empty groups retain status precedence", () => {
    const filtered = portfolio.filter(i => i.tier <= 2);
    expect(sortPortfolioInvestments(filtered, "relevance", "main").map(i => i.status)).toEqual([
      "active", "exited", "exited", "defunct",
    ]);
    expect(sortPortfolioInvestments([], "relevance", "all")).toEqual([]);
  });
});

describe("portfolio status labels", () => {
  test("exited cards display Exited and no NEW or ceased-operations label", () => {
    const markup = renderToStaticMarkup(createElement(InvestmentCard, {
      investment: investment("Succinct", "exited", { createdAt: new Date() }),
    }));
    expect(markup).toContain("Exited</span>");
    expect(markup).not.toContain("Ceased Operations");
    expect(markup).not.toContain("NEW</span>");
  });

  test("defunct cards display Ceased Operations", () => {
    const markup = renderToStaticMarkup(createElement(InvestmentCard, {
      investment: investment("Knox", "defunct"),
    }));
    expect(markup).toContain("Ceased Operations</span>");
    expect(markup).not.toContain("Exited</span>");
  });
});
