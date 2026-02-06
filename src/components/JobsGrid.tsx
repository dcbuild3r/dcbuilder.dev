"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, useCallback, useDeferredValue } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Job, JobTag, RelationshipCategory, tagLabels as defaultTagLabels } from "@/data/jobs";
import { CustomSelect } from "./CustomSelect";
import { CustomMultiSelect } from "./CustomMultiSelect";
import {
	trackJobView,
	trackJobApplyClick,
	trackJobDetailsClick,
} from "@/lib/posthog";
import { hashString, seededRandom, shuffleArray, isNew } from "@/lib/shuffle";

const ExpandedJobView = dynamic(
  () => import("./ExpandedJobView").then((mod) => mod.ExpandedJobView),
  { ssr: false }
);

type FilterCategory = "all" | RelationshipCategory;

// Company tiers matching portfolio rankings (lower = higher priority)
const companyTiers: Record<string, number> = {
  // Tier 1 - Top portfolio companies + World
  Morpho: 1,
  "Prime Intellect": 1,
  Lucis: 1,
  MegaETH: 1,
  Monad: 1,
  "Monad Foundation": 1,
  World: 1,
  // Tier 2 - Strong portfolio companies
  Succinct: 2,
  Sorella: 2,
  Agora: 2,
  Rhinestone: 2,
  Bagel: 2,
  // Tier 3 - Portfolio companies
  Ritual: 3,
  Berachain: 3,
  Inco: 3,
  // Tier 4 - Network/Friends
  Flashbots: 4,
  "Ethereum Foundation": 4,
  Aztec: 4,
  TACEO: 4,
  Nethermind: 4,
  Nascent: 4,
  CoinFund: 4,
  "Blockchain Capital": 4,
  RockawayX: 4,
  "Ackee Blockchain": 4,
  Reilabs: 4,
  "Let's Go DevOps": 4,
  Wonderland: 4,
  Merge: 4,
  // Tier 5 - Broader ecosystem
  "Uniswap Labs": 5,
  Alchemy: 5,
  // Tier 6 - Ecosystem (Monad ecosystem projects)
  Perpl: 6,
  Kuru: 6,
  RareBetSports: 6,
  // Tier 6 - Ecosystem (Berachain ecosystem projects)
  "Infrared Finance": 6,
  "Ooga Booga": 6,
  "bera.buzz": 6,
  "Kodiak Finance": 6,
  Goldsky: 6,
};

interface TagDefinition {
  id: string;
  slug: string;
  label: string;
  color: string | null;
}

interface RoleDefinition {
  id: string;
  slug: string;
  label: string;
}

interface JobsGridProps {
  jobs: Job[];
  tagDefinitions?: TagDefinition[];
  roleDefinitions?: RoleDefinition[];
}

const JOBS_PAGE_SIZE = 60;

export function JobsGrid({ jobs, tagDefinitions = [], roleDefinitions = [] }: JobsGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Build tag labels from definitions (with fallback to hardcoded)
  const tagLabels = useMemo(() => {
    const labels: Record<string, string> = { ...defaultTagLabels };
    tagDefinitions.forEach((tag) => {
      labels[tag.slug] = tag.label;
    });
    return labels;
  }, [tagDefinitions]);

  const searchParams = useSearchParams();
  const initialParams = useMemo(() => {
    const typeParam = searchParams.get("type");
    const filterCategory: FilterCategory =
      typeParam === "portfolio" || typeParam === "network" ? typeParam : "all";
    const companyParams = searchParams.getAll("company");
    const selectedCompanies = companyParams.length > 0 ? companyParams : ["all"];
    const selectedLocation = searchParams.get("location") || "all";
    const searchQuery = searchParams.get("q") || "";
    const showFeaturedOnly = searchParams.get("featured") === "1";
    const tagsParam = searchParams.get("tags");
    const selectedTags = tagsParam
      ? tagsParam
          .split(",")
          .filter((tag): tag is JobTag => Object.keys(tagLabels).includes(tag))
      : [];
    const jobId = searchParams.get("job");
    const selectedRole = searchParams.get("role") || "all";
    return {
      filterCategory,
      selectedCompanies,
      selectedLocation,
      searchQuery,
      selectedTags,
      showFeaturedOnly,
      jobId,
      selectedRole,
    };
  }, [searchParams, tagLabels]);

  const [filterCategory, setFilterCategory] = useState<FilterCategory>(initialParams.filterCategory);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(initialParams.selectedCompanies);
  const [selectedRole, setSelectedRole] = useState<string>(initialParams.selectedRole);
  const [selectedLocation, setSelectedLocation] = useState<string>(initialParams.selectedLocation);
  const [searchQuery, setSearchQuery] = useState(initialParams.searchQuery);
  const [selectedTags, setSelectedTags] = useState<JobTag[]>(initialParams.selectedTags);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(initialParams.showFeaturedOnly);
  const [displayCount, setDisplayCount] = useState(JOBS_PAGE_SIZE);
  const [expandedJob, setExpandedJob] = useState<Job | null>(() => {
    if (!initialParams.jobId) return null;
    return jobs.find((job) => job.id === initialParams.jobId) ?? null;
  });
  const [dataHotJobIds, setDataHotJobIds] = useState<Set<string>>(new Set());
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Fetch data-driven hot jobs from analytics
  useEffect(() => {
    fetch("/api/hot-jobs")
      .then((res) => res.json())
      .then((data) => {
        if (data.hotJobIds) {
          setDataHotJobIds(new Set(data.hotJobIds));
        }
      })
      .catch(() => {
				// Silently fail - hot jobs badge is non-critical
			});
  }, []);

  // Helper to build job event properties for analytics
  const getJobEventProps = useCallback((job: Job) => ({
    job_id: job.id,
    job_title: job.title,
    company_name: job.company.name,
    company_category: job.company.category,
    location: job.location,
    is_featured: job.featured ?? false,
    is_hot: job.tags?.includes("hot") ?? false,
  }), []);

  const replaceSearchParams = useCallback((nextParams: URLSearchParams) => {
    const queryString = nextParams.toString();
    if (queryString === searchParams.toString()) return;
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const updateUrlParams = useCallback((updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    replaceSearchParams(nextParams);
  }, [replaceSearchParams, searchParams]);

  // Sync URL with modal state
  const openJob = useCallback((job: Job) => {
    setExpandedJob(job);
    updateUrlParams({ job: job.id });
    trackJobView(getJobEventProps(job));
  }, [updateUrlParams, getJobEventProps]);

  const closeJob = useCallback(() => {
    setExpandedJob(null);
    updateUrlParams({ job: null });
  }, [updateUrlParams]);

  // Filter update handlers that sync to URL
  const handleCategoryChange = useCallback((value: FilterCategory) => {
    setFilterCategory(value);
    updateUrlParams({ type: value === "all" ? null : value });
  }, [updateUrlParams]);

  const handleCompanyChange = useCallback((values: string[]) => {
    setSelectedCompanies(values.length === 0 ? ["all"] : values);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("company");
    if (values.length > 0) {
      values.forEach((v) => nextParams.append("company", v));
    }
    replaceSearchParams(nextParams);
  }, [replaceSearchParams, searchParams]);

  const handleLocationChange = useCallback((value: string) => {
    setSelectedLocation(value);
    updateUrlParams({ location: value === "all" ? null : value });
  }, [updateUrlParams]);

  const handleRoleChange = useCallback((value: string) => {
    setSelectedRole(value);
    updateUrlParams({ role: value === "all" ? null : value });
  }, [updateUrlParams]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleFeaturedToggle = useCallback(() => {
    const newValue = !showFeaturedOnly;
    setShowFeaturedOnly(newValue);
    updateUrlParams({ featured: newValue ? "1" : null });
  }, [showFeaturedOnly, updateUrlParams]);

  const handleTagToggle = useCallback((tag: JobTag) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    updateUrlParams({ tags: newTags.length > 0 ? newTags.join(",") : null });
  }, [selectedTags, updateUrlParams]);

  const handleClearTags = useCallback(() => {
    setSelectedTags([]);
    updateUrlParams({ tags: null });
  }, [updateUrlParams]);

  const handleResetAllFilters = useCallback(() => {
    setFilterCategory("all");
    setSelectedCompanies(["all"]);
    setSelectedRole("all");
    setSelectedLocation("all");
    setSearchQuery("");
    setSelectedTags([]);
    setShowFeaturedOnly(false);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("type");
    nextParams.delete("company");
    nextParams.delete("role");
    nextParams.delete("location");
    nextParams.delete("q");
    nextParams.delete("tags");
    nextParams.delete("featured");
    replaceSearchParams(nextParams);
  }, [replaceSearchParams, searchParams]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateUrlParams({ q: searchQuery || null });
    }, 180);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, updateUrlParams]);

  // Check if any filter is active
  const hasActiveFilters =
    filterCategory !== "all" ||
    !selectedCompanies.includes("all") ||
    selectedRole !== "all" ||
    selectedLocation !== "all" ||
    searchQuery !== "" ||
    selectedTags.length > 0 ||
    showFeaturedOnly;

  // Handle escape key and body scroll for modal
  useEffect(() => {
    if (!expandedJob) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeJob();
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [expandedJob, closeJob]);

  // Get all unique tags from jobs
  const allTags = useMemo(() => {
    const tags = new Set<JobTag>();
    jobs.forEach((job) => job.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [jobs]);

  // Get all unique companies from jobs
  const allCompanies = useMemo(() => {
    const companies = new Map<string, string>();
    jobs.forEach((job) => companies.set(job.company.name, job.company.name));
    return Array.from(companies.values()).sort();
  }, [jobs]);

  // Get all unique roles/departments - prefer definitions, fall back to extracting from jobs
  const allRoles = useMemo(() => {
    if (roleDefinitions.length > 0) {
      // Use defined roles that exist in jobs
      const jobDepartments = new Set(jobs.map((j) => j.department).filter(Boolean));
      return roleDefinitions
        .filter((r) => jobDepartments.has(r.label) || jobDepartments.has(r.slug))
        .map((r) => r.label)
        .sort();
    }
    // Fallback: extract from jobs
    const roles = new Set<string>();
    jobs.forEach((job) => {
      if (job.department) {
        roles.add(job.department);
      }
    });
    return Array.from(roles).sort();
  }, [jobs, roleDefinitions]);

  // Get all unique locations from jobs (split on "/", " or ", ",", "(", ")" for multi-location jobs)
  // But keep "Remote (...)" as a single entry (timezone info in parens)
  const allLocations = useMemo(() => {
    const locations = new Set<string>();
    jobs.forEach((job) => {
      // Check if job is remote
      if (job.remote) {
        locations.add("Remote");
      }
      // Split location on various separators and add each part
      if (job.location) {
        // If location starts with "Remote", keep the whole thing (it's timezone info)
        if (job.location.toLowerCase().startsWith("remote")) {
          const trimmed = job.location.trim();
          if (trimmed.toLowerCase() !== "remote") {
            locations.add(trimmed);
          }
        } else {
          // For non-remote locations, split on separators
          job.location.split(/[\/(),]| or /i).forEach((part) => {
            const trimmed = part.trim();
            if (trimmed && trimmed.toLowerCase() !== "remote") {
              locations.add(trimmed);
            }
          });
        }
      }
    });
    return Array.from(locations).sort();
  }, [jobs]);

  const jobSearchIndex = useMemo(() => {
    const index = new Map<string, string>();
    jobs.forEach((job) => {
      const tagText = job.tags?.map((t) => tagLabels[t]).join(" ") || "";
      index.set(
        job.id,
        [job.title, job.company.name, job.location, job.department, tagText]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      );
    });
    return index;
  }, [jobs, tagLabels]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Category filter
      if (filterCategory !== "all" && job.company.category !== filterCategory) {
        return false;
      }

      // Company filter (supports multiple companies)
      if (!selectedCompanies.includes("all") && !selectedCompanies.includes(job.company.name)) {
        return false;
      }

      // Role/Department filter
      if (selectedRole !== "all" && job.department !== selectedRole) {
        return false;
      }

      // Location filter
      if (selectedLocation !== "all") {
        if (selectedLocation === "Remote") {
          if (!job.remote) {
            return false;
          }
        } else if (selectedLocation.toLowerCase().startsWith("remote")) {
          // For "Remote (timezone)" selections, match exactly
          if (job.location !== selectedLocation) {
            return false;
          }
        } else {
          // Check if any part of the job's location matches
          const jobLocations = job.location
            .split(/[\/(),]| or /i)
            .map((p) => p.trim())
            .filter(Boolean);
          if (!jobLocations.some((loc) => loc === selectedLocation)) {
            return false;
          }
        }
      }

      // Featured filter
      if (showFeaturedOnly && !job.featured) {
        return false;
      }

      // Tag filter (job must have ALL selected tags)
      if (selectedTags.length > 0) {
        if (
          !job.tags ||
          !selectedTags.every((tag) => job.tags?.includes(tag))
        ) {
          return false;
        }
      }

      // Search filter (title, company name, location, tags)
      if (deferredSearchQuery) {
        const query = deferredSearchQuery.toLowerCase();
        const searchableText = jobSearchIndex.get(job.id) || "";
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [
    jobs,
    filterCategory,
    selectedCompanies,
    selectedRole,
    selectedLocation,
    deferredSearchQuery,
    selectedTags,
    showFeaturedOnly,
    jobSearchIndex,
  ]);



  // Include today's date so shuffle changes daily (stable after hydration)
  const [shuffleSeed] = useState(() => new Date().toISOString().split("T")[0]);

  const filterKey = useMemo(
    () =>
      [
        filterCategory,
        selectedCompanies.join(","),
        selectedRole,
        selectedLocation,
        deferredSearchQuery,
        selectedTags.join(","),
        showFeaturedOnly,
        shuffleSeed,
      ].join("|"),
    [filterCategory, selectedCompanies, selectedRole, selectedLocation, deferredSearchQuery, selectedTags, showFeaturedOnly, shuffleSeed],
  );

  // Helper to check if job is hot (manual tag OR data-driven)
  const isHotJob = useCallback(
    (job: Job) => job.tags?.includes("hot") || dataHotJobIds.has(job.id),
    [dataHotJobIds]
  );

  // Helper to get company tier (useCallback for stable reference in useEffect)
  const getTier = useCallback(
    (job: Job) =>
      companyTiers[job.company.name] ??
      (job.company.category === "portfolio" ? 4 : 5),
    [],
  );

  // Deterministic shuffle based on filter key (stable between server/client)
  const displayJobs = useMemo(() => {
    const hot = filteredJobs.filter((j) => isHotJob(j));
    const featured = filteredJobs.filter((j) => j.featured && !isHotJob(j));
    const nonFeatured = filteredJobs.filter((j) => !j.featured && !isHotJob(j));

    const hotRandom = seededRandom(hashString(`${filterKey}|hot`));
    const featuredRandom = seededRandom(hashString(`${filterKey}|featured`));

    const shuffledHot = shuffleArray(hot, hotRandom);
    const shuffledFeatured = shuffleArray(featured, featuredRandom);

    // Group and shuffle non-featured by tier
    const tierGroups: Record<number, Job[]> = {};
    nonFeatured.forEach((job) => {
      const tier = getTier(job);
      if (!tierGroups[tier]) tierGroups[tier] = [];
      tierGroups[tier].push(job);
    });

    const shuffledNonFeatured = Object.keys(tierGroups)
      .map(Number)
      .sort((a, b) => a - b)
      .flatMap((tier) =>
        shuffleArray(
          tierGroups[tier],
          seededRandom(hashString(`${filterKey}|tier-${tier}`))
        )
      );

    return [...shuffledHot, ...shuffledFeatured, ...shuffledNonFeatured];
  }, [filteredJobs, getTier, filterKey, isHotJob]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayCount(JOBS_PAGE_SIZE);
  }, [filterKey]);

  const visibleJobs = displayJobs.slice(0, displayCount);
  const hasMoreJobs = displayJobs.length > displayCount;

  return (
    <div className="space-y-6" data-testid="jobs-grid">
      {/* Filters */}
      <div className="space-y-4">
        {/* Row 1: Category and Company filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Affiliation Filter (Portfolio/Network) */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="affiliation-filter"
              className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
            >
              Affiliation:
            </label>
            <CustomSelect
              id="affiliation-filter"
              value={filterCategory}
              onChange={(value) => handleCategoryChange(value as FilterCategory)}
              options={[
                { value: "all", label: "All" },
                { value: "portfolio", label: "Portfolio" },
                { value: "network", label: "Network" },
              ]}
              className="flex-1 sm:flex-none sm:min-w-[120px]"
            />
          </div>

          {/* Role Filter (Department) */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="role-filter"
              className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
            >
              Role:
            </label>
            <CustomSelect
              id="role-filter"
              value={selectedRole}
              onChange={handleRoleChange}
              options={[
                { value: "all", label: "All Roles" },
                ...allRoles.map((role) => ({ value: role, label: role })),
              ]}
              className="flex-1 sm:flex-none sm:min-w-[140px]"
              searchable
            />
          </div>

          {/* Company Filter (Multi-select) */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="company-filter"
              className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
            >
              Company:
            </label>
            <CustomMultiSelect
              id="company-filter"
              values={selectedCompanies.includes("all") ? [] : selectedCompanies}
              onChange={handleCompanyChange}
              options={allCompanies.map((company) => ({ value: company, label: company }))}
              placeholder="All Companies"
              className="flex-1 sm:flex-none sm:min-w-[160px]"
              searchable
            />
          </div>
        </div>

        {/* Row 2: Location filter and Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Location Filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="location-filter"
              className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
            >
              Location:
            </label>
            <CustomSelect
              id="location-filter"
              value={selectedLocation}
              onChange={handleLocationChange}
              options={[
                { value: "all", label: "All Locations" },
                ...allLocations.map((location) => ({ value: location, label: location })),
              ]}
              className="flex-1 sm:flex-none sm:min-w-[160px]"
            />
          </div>

          {/* Search - full width on mobile */}
	          <div className="flex-1 relative">
	            <input
	              type="text"
	              aria-label="Search jobs"
	              placeholder="Search jobs..."
	              value={searchQuery}
	              onChange={(e) => handleSearchChange(e.target.value)}
	              className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
	            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results count and reset */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">
            {displayJobs.length} {displayJobs.length === 1 ? "job" : "jobs"}
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleResetAllFilters}
              className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline underline-offset-2"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Tag Filters - Collapsible on mobile */}
      {allTags.length > 0 && (
        <div className="space-y-3">
          {/* Toggle button and selected tags */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Featured only toggle */}
            <button
              onClick={handleFeaturedToggle}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                showFeaturedOnly
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                  : "border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              <span className="text-amber-500">★</span>
              <span>Featured only</span>
            </button>
            <button
              onClick={() => setTagsExpanded(!tagsExpanded)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <span>Filter by tags</span>
              <svg
                className={`w-4 h-4 transition-transform ${tagsExpanded ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {/* Selected tags as pills */}
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full ${
                  tag === "hot"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold"
                    : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                }`}
              >
                {tagLabels[tag]}
                <button
                  onClick={() => handleTagToggle(tag)}
                  className="ml-1 hover:opacity-70"
                  aria-label={`Remove ${tagLabels[tag]} filter`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={handleClearTags}
                className="px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Expanded tag list */}
          {tagsExpanded && (
            <div className="flex flex-wrap gap-2 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                    tag === "hot"
                      ? selectedTags.includes(tag)
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-[0_0_15px_rgba(251,146,60,0.6)]"
                        : "bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold shadow-[0_0_10px_rgba(251,146,60,0.4)] hover:shadow-[0_0_15px_rgba(251,146,60,0.6)]"
                      : selectedTags.includes(tag)
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : "bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-600"
                  }`}
                >
                  {tagLabels[tag]}
                </button>
              ))}
              <button
                onClick={() => setTagsExpanded(false)}
                className="ml-auto px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        {displayJobs.length === 0 ? (
          <p className="text-center py-8 text-neutral-500">
            No jobs found matching your criteria.
          </p>
        ) : (
          visibleJobs.map((job) => (
            <div
              key={job.id}
              onClick={(e) => {
                // Don't open modal if clicking on nested links
                if ((e.target as HTMLElement).closest("a")) return;
                openJob(job);
              }}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${job.title} at ${job.company.name}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openJob(job);
                }
              }}
              className={`group block p-4 rounded-xl border transition-[border-color,box-shadow,background-color] cursor-pointer ${
                isHotJob(job)
                  ? "border-orange-400 dark:border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 shadow-[0_0_15px_rgba(251,146,60,0.3)] dark:shadow-[0_0_20px_rgba(251,146,60,0.2)] hover:shadow-[0_0_25px_rgba(251,146,60,0.5)] dark:hover:shadow-[0_0_30px_rgba(251,146,60,0.4)]"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Company Logo */}
                <div className="w-full sm:w-auto flex justify-center sm:justify-start">
                  <div className="w-20 h-20 sm:w-16 sm:h-16 flex-shrink-0 flex items-center justify-center">
                    <Image
                      src={job.company.logo || "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/anonymous-placeholder.svg"}
                      alt={job.company.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain bg-white rounded-lg p-2 group-hover:scale-[1.08] transition-transform duration-150"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/anonymous-placeholder.svg";
                      }}
                    />
                  </div>
                </div>

                {/* Job Details */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  {/* Desktop layout */}
                  <div className="hidden sm:block">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                          {job.title}
                          {job.featured && (
                            <span className="ml-2 text-base text-amber-500">★</span>
                          )}
                          {isHotJob(job) && (
                            <span className="ml-2 px-2.5 py-1 text-sm font-semibold rounded-full bg-orange-400 dark:bg-orange-700 text-white shadow-[0_0_12px_rgba(251,146,60,0.6)] dark:shadow-[0_0_16px_rgba(194,65,12,0.5)] animate-pulse">
                              🔥 HOT
                            </span>
                          )}
                          {isNew(job.createdAt) && (
                            <span className="ml-2 px-2.5 py-1 text-sm font-semibold rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 animate-pulse-new">
                              NEW
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {job.company.name}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 px-2.5 py-1 text-sm rounded-full ${
                          job.company.category === "portfolio"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {job.company.category === "portfolio" ? "Portfolio" : "Network"}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                      <span>{job.location}</span>
                      {job.type && (
                        <span className="capitalize">{job.type.replace("-", " ")}</span>
                      )}
                      {job.salary && <span>{job.salary}</span>}
                    </div>
                  </div>

                  {/* Mobile layout - reordered */}
                  <div className="sm:hidden space-y-1.5">
                    {/* 1. Title */}
                    <h3 className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                      {job.title}
                      {job.featured && (
                        <span className="ml-2 text-base text-amber-500">★</span>
                      )}
                    </h3>
                    {/* 2. Company name - bigger */}
                    <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
                      {job.company.name}
                    </p>
                    {/* 3. Department/Role + Location, type */}
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                      {job.department && <span>{job.department}</span>}
                      <span>{job.location}</span>
                      {job.type && (
                        <span className="capitalize">{job.type.replace("-", " ")}</span>
                      )}
                      {job.salary && <span>{job.salary}</span>}
                    </div>
                    {/* 4. Portfolio/Network badge */}
                    <div className="flex justify-center">
                      <span
                        className={`px-2.5 py-1 text-sm rounded-full ${
                          job.company.category === "portfolio"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {job.company.category === "portfolio" ? "Portfolio" : "Network"}
                      </span>
                    </div>
                    {/* 5. HOT / NEW tags */}
                    {(isHotJob(job) || isNew(job.createdAt)) && (
                      <div className="flex justify-center gap-2">
                        {isHotJob(job) && (
                          <span className="px-2.5 py-1 text-sm font-semibold rounded-full bg-orange-400 dark:bg-orange-700 text-white shadow-[0_0_12px_rgba(251,146,60,0.6)] dark:shadow-[0_0_16px_rgba(194,65,12,0.5)] animate-pulse">
                            🔥 HOT
                          </span>
                        )}
                        {isNew(job.createdAt) && (
                          <span className="px-2.5 py-1 text-sm font-semibold rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 animate-pulse-new">
                            NEW
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Row 3: Tags */}
                  {job.tags && job.tags.filter(t => t !== "hot").length > 0 && (
                    <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-1">
                      {job.tags.filter(t => t !== "hot").map((tag, index) => (
                        <span
                          key={tag}
                          className={`px-2.5 py-1 text-sm rounded-full ${index >= 3 ? "hidden sm:inline-flex" : ""} bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400`}
                        >
                          {tagLabels[tag] ?? tag}
                        </span>
                      ))}
                      {job.tags.filter(t => t !== "hot").length > 3 && (
                        <span className="sm:hidden px-2.5 py-1 text-sm text-neutral-500">
                          +{job.tags.filter(t => t !== "hot").length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Row 4: Buttons */}
                  <div className="mt-3 flex items-center justify-center sm:justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          trackJobDetailsClick(getJobEventProps(job));
                          openJob(job);
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      >
                        View details
                      </button>
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          trackJobApplyClick(getJobEventProps(job));
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                          isHotJob(job)
                            ? "bg-orange-400 dark:bg-orange-700 text-white hover:bg-orange-500 dark:hover:bg-orange-600 shadow-[0_0_10px_rgba(251,146,60,0.4)]"
                            : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200"
                        }`}
                      >
                        Apply →
                      </a>
                    </div>
                </div>
              </div>
            </div>
          ))
        )}
        {hasMoreJobs && (
          <button
            onClick={() => setDisplayCount((count) => count + JOBS_PAGE_SIZE)}
            className="w-full py-2 text-sm text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
          >
            Load more jobs ({displayJobs.length - visibleJobs.length} remaining)
          </button>
        )}
      </div>

      {/* Job Detail Modal */}
      {expandedJob && (
        <ExpandedJobView
          job={expandedJob}
          onClose={closeJob}
          jobUrl={typeof window !== "undefined" ? `${window.location.origin}/jobs?job=${expandedJob.id}` : `/jobs?job=${expandedJob.id}`}
          onViewOtherJobs={() => {
            handleCompanyChange([expandedJob.company.name]);
            closeJob();
          }}
          otherJobsCount={jobs.filter(j => j.company.name === expandedJob.company.name && j.id !== expandedJob.id).length}
          onApplyClick={() => trackJobApplyClick(getJobEventProps(expandedJob))}
          tagLabels={tagLabels}
        />
      )}
    </div>
  );
}
