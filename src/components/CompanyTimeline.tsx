"use client";

import { useMemo, useState } from "react";
import type { AggregatedNewsItem } from "@/lib/news";
import { type NewsCategory, categoryLabels } from "@/data/news";
import { CustomSelect } from "@/components/CustomSelect";
import { GitHubIcon, WebsiteIcon, XIcon } from "@/components/ui/icons";
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Timeline
            </p>
            <h2 id="company-timeline-heading" className="text-2xl font-bold">
              {activeCompany} milestones
            </h2>
            {company?.description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                {company.description}
              </p>
            )}
          </div>
          {events.length > 0 && (
            <p className="text-sm text-neutral-500">
              {visibleEvents.length} of {events.length}{" "}
              {events.length === 1 ? "event" : "events"}
            </p>
          )}
        </div>

        {company && (
          <div className="flex flex-col gap-4 border-y border-neutral-100 py-4 dark:border-neutral-900 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {company.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-800 dark:text-neutral-400"
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
                  className="flex size-12 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white sm:size-14"
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
                  className="flex size-12 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white sm:size-14"
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
                  className="flex size-12 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white sm:size-14"
                >
                  <GitHubIcon className="size-7 sm:size-8" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-200 px-4 py-5 text-sm text-neutral-500 dark:border-neutral-800">
          No indexed company events yet.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
              <div className="space-y-1.5">
                <label
                  htmlFor="timeline-search"
                  className="text-sm text-neutral-600 dark:text-neutral-400"
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
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-neutral-600"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedYear("all");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-1.5 py-0.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                      aria-label="Clear timeline search"
                    >
                      x
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="timeline-category-filter"
                  className="text-sm text-neutral-600 dark:text-neutral-400"
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
                <span className="block text-sm text-neutral-600 dark:text-neutral-400">
                  Sort:
                </span>
                <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900">
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
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950"
                            : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
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
                  className="absolute left-1 right-1 top-1/2 h-px -translate-y-1/2 bg-neutral-200 dark:bg-neutral-800"
                />
                <button
                  type="button"
                  aria-pressed={selectedYear === "all"}
                  onClick={() => setSelectedYear("all")}
                  className={`relative z-10 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selectedYear === "all"
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-950"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-white"
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
                        className={`size-3 rounded-full border-2 border-white transition-colors dark:border-neutral-950 ${
                          isSelected
                            ? "bg-neutral-900 dark:bg-white"
                            : "bg-neutral-300 group-hover:bg-neutral-500 dark:bg-neutral-700 dark:group-hover:bg-neutral-400"
                        }`}
                      />
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950"
                            : "bg-white text-neutral-500 group-hover:text-neutral-900 dark:bg-neutral-950 dark:text-neutral-500 dark:group-hover:text-white"
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

          <ol className="relative space-y-4 border-l border-neutral-200 pl-5 dark:border-neutral-800">
            {visibleEvents.map((event, index) => (
              <li key={event.id} className="relative">
                <span
                  className={`absolute -left-[29px] top-1.5 size-3 rounded-full border-2 border-white dark:border-neutral-950 ${
                    index === 0
                      ? "bg-neutral-900 dark:bg-white"
                      : "bg-neutral-300 dark:bg-neutral-700"
                  }`}
                />
                <a
                  href={event.url}
                  target={event.type === "blog" ? undefined : "_blank"}
                  rel={event.type === "blog" ? undefined : "noopener noreferrer"}
                  className="group block rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600 sm:p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <time dateTime={event.date}>{formatDate(event.date)}</time>
                    {getTimelineBadges(event).map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-6 transition-colors group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400 sm:line-clamp-2">
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
