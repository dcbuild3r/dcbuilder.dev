"use client";

import { useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import { CustomMultiSelect } from "@/components/CustomMultiSelect";
import { fieldClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { FilterCategory } from "@/lib/jobs-filter";

const TAGS_COLLAPSED = 12;

export interface JobsFiltersProps {
  category: FilterCategory;
  onCategory: (value: FilterCategory) => void;
  role: string;
  onRole: (value: string) => void;
  roles: string[];
  companies: string[]; // ["all"] means none selected
  onCompanies: (values: string[]) => void;
  allCompanies: string[];
  location: string;
  onLocation: (value: string) => void;
  locations: string[];
  query: string;
  onQuery: (value: string) => void;
  featuredOnly: boolean;
  onFeaturedToggle: () => void;
  allTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearTags: () => void;
  getTagLabel: (tag: string) => string;
}

export function JobsFilters(p: JobsFiltersProps) {
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const visibleTags = tagsExpanded
    ? p.allTags
    : p.allTags.filter((t, i) => i < TAGS_COLLAPSED || p.selectedTags.includes(t));

  const pillSelect = "[&>button]:min-h-12 [&>button]:rounded-full [&>button]:px-4 [&>button]:font-medium";
  const segments: { value: FilterCategory; label: string }[] = [
    { value: "all", label: "All" },
    { value: "portfolio", label: "Portfolio" },
    { value: "network", label: "Network" },
  ];

  return (
    <div className="flex flex-col gap-3" role="search" aria-label="Filters">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex min-w-0 flex-[1_1_320px]">
          <svg className="pointer-events-none absolute left-[18px] top-[15px] size-[18px] text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <label htmlFor="job-search" className="sr-only">Search</label>
          <input
            id="job-search"
            type="text"
            placeholder="Search jobs..."
            value={p.query}
            onChange={(e) => p.onQuery(e.target.value)}
            className={cn(fieldClass, "min-h-12 w-full rounded-full pl-[46px] pr-12 text-[15px] shadow-sm")}
          />
          {p.query && (
            <button
              type="button"
              onClick={() => p.onQuery("")}
              className="absolute right-0.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-muted hover:text-ink"
              aria-label="Clear search"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <div id="affiliation-filter" role="group" aria-label="Affiliation" className="flex rounded-full border border-line-strong bg-surface p-[3px]">
          {segments.map((seg) => {
            const active = p.category === seg.value;
            return (
              <button
                key={seg.value}
                type="button"
                aria-pressed={active}
                onClick={() => p.onCategory(seg.value)}
                className={cn(
                  "min-h-11 rounded-full px-4 text-sm",
                  active ? "bg-inverse font-semibold text-inverse-ink" : "font-medium text-body hover:text-ink",
                )}
              >
                {seg.label}
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-44">
          <label htmlFor="role-filter" className="sr-only">Role</label>
          <CustomSelect
            id="role-filter"
            className={pillSelect}
            value={p.role}
            onChange={p.onRole}
            options={[
              { value: "all", label: "All roles" },
              ...p.roles.map((role) => ({ value: role, label: role })),
            ]}
            searchable
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label
          className={cn(
            "flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-[13px] font-semibold",
            p.featuredOnly ? "border-warm bg-warm-soft text-warm" : "border-line-strong bg-surface text-warm",
          )}
        >
          <input
            type="checkbox"
            checked={p.featuredOnly}
            onChange={p.onFeaturedToggle}
            className="size-4 accent-accent"
          />
          Featured only
        </label>
        <div className="w-full min-w-0 sm:w-56">
          <label htmlFor="company-filter" className="sr-only">Company</label>
          <CustomMultiSelect
            id="company-filter"
            className={pillSelect}
            values={p.companies.includes("all") ? [] : p.companies}
            onChange={p.onCompanies}
            options={p.allCompanies.map((company) => ({ value: company, label: company }))}
            placeholder="All companies"
            searchable
          />
        </div>
        <div className="w-full sm:w-48">
          <label htmlFor="location-filter" className="sr-only">Location</label>
          <CustomSelect
            id="location-filter"
            className={pillSelect}
            value={p.location}
            onChange={p.onLocation}
            options={[
              { value: "all", label: "All locations" },
              ...p.locations.map((location) => ({ value: location, label: location })),
            ]}
          />
        </div>
      </div>

      {p.allTags.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-medium text-body">Tags</p>
            {p.selectedTags.length > 0 && (
              <button
                type="button"
                onClick={p.onClearTags}
                className="text-[13px] text-muted underline underline-offset-2 hover:text-ink"
              >
                Clear tags
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => {
              const active = p.selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  onClick={() => p.onTagToggle(tag)}
                  className={cn(
                    "min-h-9 rounded-full border px-3 text-[13px]",
                    active
                      ? "border-transparent bg-inverse text-inverse-ink"
                      : tag === "hot"
                        ? "border-line bg-warm-soft text-warm"
                        : "border-line bg-surface text-body hover:border-line-strong",
                  )}
                >
                  {p.getTagLabel(tag)}
                </button>
              );
            })}
          </div>
          {p.allTags.length > TAGS_COLLAPSED && (
            <button
              type="button"
              onClick={() => setTagsExpanded((v) => !v)}
              aria-expanded={tagsExpanded}
              className="mt-2 min-h-9 text-[13px] font-medium text-accent"
            >
              {tagsExpanded ? "Show fewer tags" : `Show all ${p.allTags.length} tags`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
