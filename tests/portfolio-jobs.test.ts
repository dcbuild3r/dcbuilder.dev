import { describe, expect, test } from "bun:test";
import {
  getFeaturedPortfolioJobCompanies,
  getPortfolioJobCompanies,
} from "../src/lib/portfolio-jobs";

describe("portfolio job helpers", () => {
  test("maps portfolio companies to configured hiring entities", () => {
    expect(getPortfolioJobCompanies("Monad")).toEqual([
      "Monad Foundation",
      "Category Labs",
    ]);
    expect(getPortfolioJobCompanies("Morpho")).toEqual(["Morpho"]);
  });

  test("returns job companies for featured portfolio investments only", () => {
    const companies = getFeaturedPortfolioJobCompanies([
      { title: "Monad", featured: true },
      { title: "Morpho", featured: false },
      { title: "Prime Intellect", featured: null },
      { title: "MegaETH", featured: true },
    ]);

    expect(companies).toEqual(
      new Set(["Monad Foundation", "Category Labs", "MegaETH"])
    );
  });
});
