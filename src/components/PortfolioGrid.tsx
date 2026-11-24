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
import { sortPortfolioInvestments } from "@/lib/portfolio-order";
import { getPortfolioJobCount, getPortfolioJobsUrl } from "@/lib/portfolio-jobs";
import { getPortfolioNewsUrl } from "@/lib/portfolio-news";
import { buttonClass } from "@/components/ui/Button";
import { fieldClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface PortfolioGridProps {
  investments: Investment[];
  jobCounts?: Record<string, number>;
  newsCounts?: Record<string, number>;
  categories?: InvestmentCategory[];
}

export function PortfolioGrid({
  investments,
  jobCounts = {},
  newsCounts = {},
  categories = [],
}: PortfolioGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [query, setQuery] = useState("");

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

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((i) =>
        `${i.title} ${i.description ?? ""}`.toLowerCase().includes(q)
      );
    }

    // Apply category filter (match ANY selected category)
    if (selectedCategories.length > 0) {
      result = result.filter((i) =>
        selectedCategories.some((cat) => i.categories?.includes(cat))
      );
    }

    return result;
  }, [investments, filter, selectedCategories, jobCounts, query]);

  // Keep status groups stable under every sort and filter.
  const displayInvestments = useMemo(
    () => sortPortfolioInvestments(
      filteredInvestments,
      sortBy,
      `${filter}|${sortBy}|${selectedCategories.join(",") || "all"}`
    ),
    [filteredInvestments, sortBy, filter, selectedCategories]
  );

  // Keep exited investments at the end of the main grid, before the defunct separator
  const activeInvestments = displayInvestments.filter(
    (i) => i.status !== "defunct"
  );
  const defunctInvestments = displayInvestments.filter(
    (i) => i.status === "defunct"
  );

  const filters: { key: FilterOption; label: string; count: number; show: boolean }[] = [
    { key: "main", label: "Main", count: mainCount, show: true },
    { key: "featured", label: "Featured", count: featuredCount, show: true },
    { key: "hiring", label: "Hiring", count: hiringCount, show: true },
    { key: "all", label: "All", count: investments.length, show: tier4Count > 0 },
  ];

  const cardProps = (investment: Investment) => ({
    investment,
    newsUrl:
      (newsCounts[investment.title] ?? 0) > 0
        ? getPortfolioNewsUrl(investment.title)
        : undefined,
  });

  return (
    <div className="space-y-4" data-testid="portfolio-grid">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-3">
        <label htmlFor="portfolio-search" className="sr-only">Search investments</label>
        <input
          id="portfolio-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search investments"
          className={cn(fieldClass, "min-w-0 flex-[1_1_240px]")}
        />
        <label htmlFor="show-select" className="sr-only">Show</label>
        <select
          id="show-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterOption)}
          className={fieldClass}
        >
          {filters
            .filter((f) => f.show)
            .map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
                {f.key === "hiring" ? "" : ` (${f.count})`}
              </option>
            ))}
        </select>
        {categories.length > 0 && (
          <>
            <label htmlFor="category-select" className="sr-only">Category</label>
            <select
              id="category-select"
              value={selectedCategories[0] ?? ""}
              onChange={(e) =>
                setSelectedCategories(e.target.value ? [e.target.value] : [])
              }
              className={fieldClass}
            >
              <option value="">All categories</option>
              {categoriesWithCounts.map(({ category }) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </>
        )}
        <label htmlFor="sort-select" className="sr-only">Sort</label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className={fieldClass}
        >
          <option value="relevance">Sort: Relevance</option>
          <option value="alphabetical">Sort: A → Z</option>
          <option value="alphabetical-desc">Sort: Z → A</option>
        </select>
      </div>
      <p className="!mt-3 px-1 font-mono text-xs text-muted" aria-live="polite">
        {displayInvestments.length} investments
      </p>

      {/* Grid - Active Investments */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
        {activeInvestments.map((investment) => (
          <InvestmentCard
            key={investment.title}
            {...cardProps(investment)}
            jobCount={getPortfolioJobCount(investment.title, jobCounts)}
            jobsUrl={getPortfolioJobsUrl(investment.title)}
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
          {defunctInvestments.map((investment) => (
            <InvestmentCard key={investment.title} {...cardProps(investment)} />
          ))}
        </div>
      )}

      {filter === "main" && tier4Count > 0 && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={buttonClass({ variant: "secondary" })}
          >
            +{tier4Count} more investments
          </button>
        </div>
      )}
    </div>
  );
}
