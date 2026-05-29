"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { InvestmentCard } from "./InvestmentCard";
import { R2_PUBLIC_URL } from "@/services/r2";
import {
  Investment,
  InvestmentCategory,
  SortOption,
  FilterOption,
} from "@/types/investments";
import { hashString, seededRandom, shuffleArray } from "@/lib/shuffle";
import { getPortfolioJobCount, getPortfolioJobsUrl } from "@/lib/portfolio-jobs";
import { getPortfolioNewsUrl } from "@/lib/portfolio-news";

interface PortfolioGridProps {
  investments: Investment[];
  jobCounts?: Record<string, number>;
  categories?: InvestmentCategory[];
}

export function PortfolioGrid({
  investments,
  jobCounts = {},
  categories = [],
}: PortfolioGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Count investments by tier/featured
  const mainCount = useMemo(
    () => investments.filter((i) => i.tier <= 3).length,
    [investments]
  );
  const featuredCount = useMemo(
    () => investments.filter((i) => i.featured).length,
    [investments]
  );
  const hiringCount = useMemo(
    () =>
      investments.filter((i) => getPortfolioJobCount(i.title, jobCounts) > 0)
        .length,
    [investments, jobCounts]
  );
  const tier4Count = investments.length - mainCount;

  // Get categories with their investment counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    investments.forEach((inv) => {
      inv.categories?.forEach((cat) => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });
    // Show all categories from props, with their counts (including 0)
    return categories.map((c) => ({
      category: c.label,
      count: counts[c.label] || 0,
    }));
  }, [investments, categories]);

  // Filtered investments based on filter option and category (multi-select)
  const filteredInvestments = useMemo(() => {
    let result = investments;

    // Apply tier/featured filter
    if (filter === "featured") {
      result = result.filter((i) => i.featured);
    } else if (filter === "hiring") {
      result = result.filter(
        (i) => getPortfolioJobCount(i.title, jobCounts) > 0
      );
    } else if (filter === "main") {
      result = result.filter((i) => i.tier <= 3);
    }

    // Apply category filter (match ANY selected category)
    if (selectedCategories.length > 0) {
      result = result.filter((i) =>
        selectedCategories.some((cat) => i.categories?.includes(cat))
      );
    }

    return result;
  }, [investments, filter, selectedCategories, jobCounts]);

  // Deterministic sort (no shuffle - that happens in useEffect)
  // Deterministic display order (stable between server/client)
  // Defunct companies always go last
  const displayInvestments = useMemo(() => {
    const active = filteredInvestments.filter((i) => i.status !== "defunct");
    const defunct = filteredInvestments.filter((i) => i.status === "defunct");

    if (sortBy === "alphabetical") {
      return [
        ...active.sort((a, b) => a.title.localeCompare(b.title)),
        ...defunct.sort((a, b) => a.title.localeCompare(b.title)),
      ];
    }
    if (sortBy === "alphabetical-desc") {
      return [
        ...active.sort((a, b) => b.title.localeCompare(a.title)),
        ...defunct.sort((a, b) => b.title.localeCompare(a.title)),
      ];
    }

    // Relevance: featured first (shuffled within tier groups), then non-featured, defunct last
    const featured = active.filter((i) => i.featured);
    const nonFeatured = active.filter((i) => !i.featured);

    const seedBase = `${filter}|${sortBy}|${
      selectedCategories.join(",") || "all"
    }`;

    // Group featured by tier and shuffle each group
    const featuredTierGroups: Record<number, Investment[]> = {};
    featured.forEach((inv) => {
      if (!featuredTierGroups[inv.tier]) featuredTierGroups[inv.tier] = [];
      featuredTierGroups[inv.tier].push(inv);
    });

    const shuffledFeatured = Object.keys(featuredTierGroups)
      .map(Number)
      .sort((a, b) => a - b)
      .flatMap((tier) =>
        shuffleArray(
          featuredTierGroups[tier],
          seededRandom(hashString(`${seedBase}|featured|tier-${tier}`))
        )
      );

    // Group non-featured by tier and shuffle each group
    const tierGroups: Record<number, Investment[]> = {};
    nonFeatured.forEach((inv) => {
      if (!tierGroups[inv.tier]) tierGroups[inv.tier] = [];
      tierGroups[inv.tier].push(inv);
    });

    const shuffledNonFeatured = Object.keys(tierGroups)
      .map(Number)
      .sort((a, b) => a - b)
      .flatMap((tier) =>
        shuffleArray(
          tierGroups[tier],
          seededRandom(hashString(`${seedBase}|tier-${tier}`))
        )
      );

    const shuffledDefunct = shuffleArray(
      defunct,
      seededRandom(hashString(`${seedBase}|defunct`))
    );

    return [...shuffledFeatured, ...shuffledNonFeatured, ...shuffledDefunct];
  }, [filteredInvestments, sortBy, filter, selectedCategories]);

  // Split into active and defunct for rendering with separator
  const activeInvestments = displayInvestments.filter(
    (i) => i.status !== "defunct"
  );
  const defunctInvestments = displayInvestments.filter(
    (i) => i.status === "defunct"
  );

  return (
    <div className="space-y-6" data-testid="portfolio-grid">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <label
            htmlFor="sort-select"
            className="text-sm text-neutral-600 dark:text-neutral-400"
          >
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
          >
            <option value="relevance">Relevance</option>
            <option value="alphabetical">A → Z</option>
            <option value="alphabetical-desc">Z → A</option>
          </select>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter("main")}
            className={`shrink-0 whitespace-nowrap px-4 py-1.5 text-sm rounded-lg border transition-colors ${
              filter === "main"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
                : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            Main ({mainCount})
          </button>
          <button
            onClick={() => setFilter("featured")}
            className={`shrink-0 whitespace-nowrap px-4 py-1.5 text-sm rounded-lg border transition-colors ${
              filter === "featured"
                ? "bg-amber-500 text-white border-transparent"
                : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            ★ Featured ({featuredCount})
          </button>
          <button
            onClick={() => setFilter("hiring")}
            className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-1.5 text-sm rounded-lg border transition-colors ${
              filter === "hiring"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
                : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                  filter === "hiring"
                    ? "bg-white dark:bg-neutral-900"
                    : "bg-neutral-900 dark:bg-white"
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  filter === "hiring"
                    ? "bg-white dark:bg-neutral-900"
                    : "bg-neutral-900 dark:bg-white"
                }`}
              />
            </span>
            Hiring ({hiringCount})
          </button>
          {tier4Count > 0 && (
            <button
              onClick={() => setFilter("all")}
              className={`shrink-0 whitespace-nowrap px-4 py-1.5 text-sm rounded-lg border transition-colors ${
                filter === "all"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
                  : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              All ({investments.length})
            </button>
          )}
        </div>
      </div>

      {/* Category Filters (Multi-select) */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-600 dark:text-neutral-400 mr-1">
            Category:
          </span>
          {selectedCategories.length > 0 && (
            <button
              onClick={() => setSelectedCategories([])}
              className="px-3 py-1 text-xs rounded-full border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Clear ({selectedCategories.length})
            </button>
          )}
          {categoriesWithCounts.map(({ category, count }) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <button
                key={category}
                onClick={() => {
                  if (isSelected) {
                    setSelectedCategories(
                      selectedCategories.filter((c) => c !== category)
                    );
                  } else {
                    setSelectedCategories([...selectedCategories, category]);
                  }
                }}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  isSelected
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
                    : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Grid - Active Investments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeInvestments.map((investment) => (
          <InvestmentCard
            key={investment.title}
            investment={investment}
            jobCount={getPortfolioJobCount(investment.title, jobCounts)}
            jobsUrl={getPortfolioJobsUrl(investment.title)}
            newsUrl={getPortfolioNewsUrl(investment.title)}
          />
        ))}
      </div>

      {/* Separator GIF between active and defunct */}
      {defunctInvestments.length > 0 && (
        <div className="flex justify-center py-4">
          <Image
            src={`${R2_PUBLIC_URL}/site/portfolio-separator.gif`}
            alt="Separator"
            width={512}
            height={512}
            sizes="(min-width: 640px) 512px, 320px"
            unoptimized
            className="w-[512px] h-[512px] object-contain"
          />
        </div>
      )}

      {/* Grid - Defunct Investments */}
      {defunctInvestments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {defunctInvestments.map((investment) => (
            <InvestmentCard
              key={investment.title}
              investment={investment}
              newsUrl={getPortfolioNewsUrl(investment.title)}
            />
          ))}
        </div>
      )}

      {/* Show more hint when not showing all - clickable */}
      {filter === "main" && tier4Count > 0 && (
        <button
          onClick={() => setFilter("all")}
          className="w-full text-center text-sm text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
        >
          +{tier4Count} more investments
        </button>
      )}
    </div>
  );
}
