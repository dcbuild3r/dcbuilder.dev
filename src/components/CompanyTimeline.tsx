"use client";

import { useMemo, useState } from "react";
import type { AggregatedNewsItem } from "@/lib/news";
import { type NewsCategory, categoryLabels } from "@/data/news";
import { CustomSelect } from "@/components/CustomSelect";
import { Badge } from "@/components/ui/badge";
import { fieldClass } from "@/components/ui/field";
import { CloseIcon, GitHubIcon, WebsiteIcon, XIcon } from "@/components/ui/icons";
import { compareNewsByDateAndRelevance } from "@/lib/news-sorting";

interface CompanyTimelineProps {
  companyName: string;
  events: AggregatedNewsItem[];
  company?: CompanyProfile | null;
}

type SelectedYear = "all" | number;
type SelectedCategory = "all" | NewsCategory;
type TimelineSortOrder = "newest" | "oldest";

interface CompanyProfile {
  title: string;
  description: string | null;
  logo: string | null;
  categories: string[];
  website: string | null;
  x: string | null;
  github: string | null;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatDate(dateString: string) {
  return dateFormatter.format(new Date(dateString));
}

function getEventYear(event: AggregatedNewsItem) {
  return new Date(event.date).getUTCFullYear();
}

function getTimelineBadges(event: AggregatedNewsItem) {
  const badges: string[] = [];

  if (event.platform === "x" || event.category === "x_post") {
    badges.push("X Post");
  } else if (event.platform === "github") {
    badges.push("GitHub");
  } else if (event.platform === "blog" || event.type === "blog") {
    badges.push("Blog");
  }

  const categoryLabel = categoryLabels[event.category];
  if (categoryLabel && !badges.includes(categoryLabel)) {
    badges.push(categoryLabel);
  }

  return badges;
}

function eventMatchesSearch(event: AggregatedNewsItem, query: string) {
  if (!query) return true;

  const searchableText = [
    event.title,
    event.description,
    event.company,
    event.source,
    event.platform,
    categoryLabels[event.category],
    ...getTimelineBadges(event),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query);
}

export function CompanyTimeline({
  companyName,
  events,
  company,
}: CompanyTimelineProps) {
  const [selectedYear, setSelectedYear] = useState<SelectedYear>("all");
  const [selectedCategory, setSelectedCategory] =
    useState<SelectedCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<TimelineSortOrder>("newest");
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const categories = useMemo(
    () => Array.from(new Set(events.map((event) => event.category))).sort(),
    [events]
  );
  const categoryEvents = useMemo(
    () =>
      selectedCategory === "all"
        ? events
        : events.filter((event) => event.category === selectedCategory),
    [events, selectedCategory]
  );
  const searchedEvents = useMemo(
    () =>
      categoryEvents.filter((event) =>
        eventMatchesSearch(event, normalizedSearchQuery)
      ),
    [categoryEvents, normalizedSearchQuery]
  );
  const years = useMemo(
    () =>
      Array.from(new Set(searchedEvents.map(getEventYear))).sort(
        (a, b) => b - a
      ),
    [searchedEvents]
  );
  const visibleEvents = useMemo(
    () => {
      const filteredEvents =
        selectedYear === "all"
          ? searchedEvents
          : searchedEvents.filter((event) => getEventYear(event) === selectedYear);

      return [...filteredEvents].sort((a, b) =>
        compareNewsByDateAndRelevance(
          a,
          b,
          sortOrder === "newest" ? "desc" : "asc"
        )
      );
    },
    [searchedEvents, selectedYear, sortOrder]
  );
  const activeCompany = company?.title || companyName;

  if (!companyName) return null;

  return (
    <section
      aria-labelledby="company-timeline-heading"
      className="mb-8 sm:mb-10"
      data-testid="company-timeline"
    >
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-muted">
              Timeline
            </p>
            <h2 id="company-timeline-heading" className="text-2xl font-semibold tracking-tight text-ink">
              {activeCompany} milestones
            </h2>
            {company?.description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-body">
                {company.description}
              </p>
            )}
          </div>
          {events.length > 0 && (
            <p className="font-mono text-xs text-muted">
              {visibleEvents.length} of {events.length}{" "}
              {events.length === 1 ? "event" : "events"}
            </p>
          )}
        </div>

        {company && (
          <div className="flex flex-col gap-4 border-y border-line py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {company.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-body"
                >
                  {category}
                </span>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Website"
                  aria-label={`Visit ${activeCompany} website`}
                  className="flex size-12 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink sm:size-14"
                >
                  <WebsiteIcon className="size-7 sm:size-8" />
                </a>
              )}
              {company.x && (
                <a
                  href={company.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="X"
                  aria-label={`Visit ${activeCompany} on X`}
                  className="flex size-12 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink sm:size-14"
                >
                  <XIcon className="size-7 sm:size-8" />
                </a>
              )}
              {company.github && (
                <a
                  href={company.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="GitHub"
                  aria-label={`Visit ${activeCompany} on GitHub`}
                  className="flex size-12 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink sm:size-14"
                >
                  <GitHubIcon className="size-7 sm:size-8" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong px-4 py-5 text-sm text-muted">
          No indexed company events yet.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
              <div className="space-y-1.5">
                <label
                  htmlFor="timeline-search"
                  className="text-sm text-body"
                >
                  Search:
                </label>
                <div className="relative">
                  <input
                    id="timeline-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setSelectedYear("all");
                    }}
                    placeholder={`Search ${activeCompany} news...`}
                    className={`${fieldClass} w-full pr-10`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedYear("all");
                      }}
                      className="absolute right-0 top-0 flex size-11 items-center justify-center text-muted hover:text-ink"
                      aria-label="Clear timeline search"
                    >
                      <CloseIcon className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="timeline-category-filter"
                  className="text-sm text-body"
                >
                  Category:
                </label>
                <CustomSelect
                  id="timeline-category-filter"
                  value={selectedCategory}
                  onChange={(value) => {
                    setSelectedCategory(value as SelectedCategory);
                    setSelectedYear("all");
                  }}
                  options={[
                    { value: "all", label: "All Categories" },
                    ...categories.map((category) => ({
                      value: category,
                      label: categoryLabels[category],
                    })),
                  ]}
                  className="min-w-[180px]"
                />
              </div>

              <div className="space-y-1.5">
                <span className="block text-sm text-body">
                  Sort:
                </span>
                <div className="inline-flex rounded-full border border-line-strong bg-surface p-1">
                  {[
                    ["newest", "Newest"],
                    ["oldest", "Oldest"],
                  ].map(([value, label]) => {
                    const isSelected = sortOrder === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSortOrder(value as TimelineSortOrder)}
                        className={`min-h-9 rounded-full px-4 text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-inverse text-inverse-ink"
                            : "text-body hover:text-ink"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <div
                aria-label={`${companyName} timeline years`}
                className="relative flex min-w-max items-center gap-4 px-1 py-3"
              >
                <span
                  aria-hidden="true"
                  className="absolute left-1 right-1 top-1/2 h-px -translate-y-1/2 bg-line"
                />
                <button
                  type="button"
                  aria-pressed={selectedYear === "all"}
                  onClick={() => setSelectedYear("all")}
                  className={`relative z-10 min-h-9 rounded-full border px-3 text-xs font-medium transition-colors ${
                    selectedYear === "all"
                      ? "border-inverse bg-inverse text-inverse-ink"
                      : "border-line-strong bg-surface text-body hover:text-ink"
                  }`}
                >
                  All years
                </button>
                {years.map((year) => {
                  const isSelected = selectedYear === year;

                  return (
                    <button
                      key={year}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedYear(year)}
                      className="group relative z-10 flex min-w-16 flex-col items-center gap-1"
                    >
                      <span
                        className={`size-3 rounded-full border-2 border-ground transition-colors ${
                          isSelected
                            ? "bg-inverse"
                            : "bg-line-strong group-hover:bg-muted"
                        }`}
                      />
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-inverse text-inverse-ink"
                            : "bg-ground text-muted group-hover:text-ink"
                        }`}
                      >
                        {year}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <ol className="relative space-y-4 border-l border-line pl-5">
            {visibleEvents.map((event, index) => (
              <li key={event.id} className="relative">
                <span
                  className={`absolute -left-[29px] top-1.5 size-3 rounded-full border-2 border-ground ${
                    index === 0
                      ? "bg-inverse"
                      : "bg-line-strong"
                  }`}
                />
                <a
                  href={event.url}
                  target={event.type === "blog" ? undefined : "_blank"}
                  rel={event.type === "blog" ? undefined : "noopener noreferrer"}
                  className="group block rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <time className="font-mono" dateTime={event.date}>{formatDate(event.date)}</time>
                    {getTimelineBadges(event).map((badge) => (
                      <Badge key={badge} variant="neutral">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-6 text-ink transition-colors group-hover:text-accent">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-body sm:line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
