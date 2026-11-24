"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, useCallback, useDeferredValue } from "react";
import { useSearchParams } from "next/navigation";
import { Job, tagLabels as defaultTagLabels } from "@/data/jobs";
import { CardList } from "@/components/ui/Card";
import { JobRow } from "@/components/jobs/JobRow";
import { JobsFilters } from "@/components/jobs/JobsFilters";
import {
  trackJobView,
  trackJobApplyClick,
  trackJobDetailsClick,
} from "@/lib/posthog";
import { getJobTagLabel, normalizeJobTags } from "@/lib/job-tags";
import {
  type FilterCategory,
  buildSearchIndex,
  filterJobs,
  getAllLocations,
  getAllRoles,
  rankJobs,
} from "@/lib/jobs-filter";

const ExpandedJobView = dynamic(
  () => import("./ExpandedJobView").then((mod) => mod.ExpandedJobView),
  { ssr: false }
);

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
  // Build tag labels from definitions (with fallback to hardcoded)
  const tagLabels = useMemo(() => {
    const labels: Record<string, string> = { ...defaultTagLabels };
    tagDefinitions.forEach((tag) => {
      const [slug] = normalizeJobTags([tag.slug]);
      const label = tag.label.trim();
      if (slug && label) {
        labels[slug] = label;
      }
    });
    return labels;
  }, [tagDefinitions]);

  const getTagLabel = useCallback(
    (tag: string) => getJobTagLabel(tag, tagLabels),
    [tagLabels],
  );

  // Get all unique displayable tags from jobs
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    jobs.forEach((job) => normalizeJobTags(job.tags).forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort((a, b) => getTagLabel(a).localeCompare(getTagLabel(b)));
  }, [jobs, getTagLabel]);

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
      ? normalizeJobTags(tagsParam.split(",")).filter((tag) => allTags.includes(tag))
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
  }, [searchParams, allTags]);

  const [filterCategory, setFilterCategory] = useState<FilterCategory>(initialParams.filterCategory);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(initialParams.selectedCompanies);
  const [selectedRole, setSelectedRole] = useState<string>(initialParams.selectedRole);
  const [selectedLocation, setSelectedLocation] = useState<string>(initialParams.selectedLocation);
  const [searchQuery, setSearchQuery] = useState(initialParams.searchQuery);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialParams.selectedTags);
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
    const currentUrl = new URL(window.location.href);
    const queryString = nextParams.toString();
    if (queryString === currentUrl.searchParams.toString()) return;
    window.history.replaceState(null, "", queryString ? `${currentUrl.pathname}?${queryString}` : currentUrl.pathname);
  }, []);

  const updateUrlParams = useCallback((updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    replaceSearchParams(nextParams);
  }, [replaceSearchParams]);

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
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.delete("company");
    if (values.length > 0) {
      values.forEach((v) => nextParams.append("company", v));
    }
    replaceSearchParams(nextParams);
  }, [replaceSearchParams]);

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

  const handleTagToggle = useCallback((tag: string) => {
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
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.delete("type");
    nextParams.delete("company");
    nextParams.delete("role");
    nextParams.delete("location");
    nextParams.delete("q");
    nextParams.delete("tags");
    nextParams.delete("featured");
    replaceSearchParams(nextParams);
  }, [replaceSearchParams]);

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


  const allCompanies = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.company.name))).sort(),
    [jobs],
  );
  const allRoles = useMemo(() => getAllRoles(jobs, roleDefinitions), [jobs, roleDefinitions]);
  const allLocations = useMemo(() => getAllLocations(jobs), [jobs]);
  const jobSearchIndex = useMemo(() => buildSearchIndex(jobs, getTagLabel), [jobs, getTagLabel]);

  const filteredJobs = useMemo(
    () =>
      filterJobs(
        jobs,
        {
          category: filterCategory,
          companies: selectedCompanies,
          role: selectedRole,
          location: selectedLocation,
          tags: selectedTags,
          featuredOnly: showFeaturedOnly,
          query: deferredSearchQuery,
        },
        jobSearchIndex,
      ),
    [
      jobs,
      filterCategory,
      selectedCompanies,
      selectedRole,
      selectedLocation,
      deferredSearchQuery,
      selectedTags,
      showFeaturedOnly,
      jobSearchIndex,
    ],
  );

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

  // Hot = manual tag OR data-driven
  const isHotJob = useCallback(
    (job: Job) => !!job.tags?.includes("hot") || dataHotJobIds.has(job.id),
    [dataHotJobIds]
  );

  const displayJobs = useMemo(
    () => rankJobs(filteredJobs, filterKey, isHotJob),
    [filteredJobs, filterKey, isHotJob],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayCount(JOBS_PAGE_SIZE);
  }, [filterKey]);

  const visibleJobs = displayJobs.slice(0, displayCount);
  const hasMoreJobs = displayJobs.length > displayCount;

  return (
    <div className="flex flex-col gap-4" data-testid="jobs-grid">
      <div>
        <JobsFilters
          category={filterCategory}
          onCategory={handleCategoryChange}
          role={selectedRole}
          onRole={handleRoleChange}
          roles={allRoles}
          companies={selectedCompanies}
          onCompanies={handleCompanyChange}
          allCompanies={allCompanies}
          location={selectedLocation}
          onLocation={handleLocationChange}
          locations={allLocations}
          query={searchQuery}
          onQuery={handleSearchChange}
          featuredOnly={showFeaturedOnly}
          onFeaturedToggle={handleFeaturedToggle}
          allTags={allTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          onClearTags={handleClearTags}
          getTagLabel={getTagLabel}
        />
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted" aria-live="polite">
            {displayJobs.length} {displayJobs.length === 1 ? "job" : "jobs"}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="min-h-11 text-sm text-muted underline underline-offset-2 hover:text-ink"
            >
              Reset filters
            </button>
          )}
        </div>

        {displayJobs.length === 0 ? (
          <p className="py-8 text-center text-muted">No jobs found matching your criteria.</p>
        ) : (
          <CardList>
            {visibleJobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                isHot={!!isHotJob(job)}
                getTagLabel={getTagLabel}
                onOpen={() => openJob(job)}
                onDetails={() => {
                  trackJobDetailsClick(getJobEventProps(job));
                  openJob(job);
                }}
                onApply={() => trackJobApplyClick(getJobEventProps(job))}
              />
            ))}
            {hasMoreJobs && (
              <button
                type="button"
                onClick={() => setDisplayCount((count) => count + JOBS_PAGE_SIZE)}
                className="min-h-[52px] w-full bg-surface text-sm font-medium text-accent"
              >
                Load more jobs ({displayJobs.length - visibleJobs.length} remaining)
              </button>
            )}
          </CardList>
        )}
      </div>

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
