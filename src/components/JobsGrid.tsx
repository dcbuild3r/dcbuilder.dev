"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { Job, JobTag, RelationshipCategory, tagLabels } from "@/data/jobs";
import { CustomSelect } from "./CustomSelect";

// Job type labels for display
const jobTypeLabels: Record<string, string> = {
	"full-time": "Full-time",
	"part-time": "Part-time",
	contract: "Contract",
	internship: "Internship",
};

// Expanded Job View Component
function ExpandedJobView({
	job,
	onClose,
}: {
	job: Job;
	onClose: () => void;
}) {
	const isHot = job.tags?.includes("hot");

	return (
		<div
			className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className={`relative w-full sm:max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl ${
					isHot
						? "ring-2 ring-orange-400 dark:ring-orange-500"
						: "ring-1 ring-neutral-200 dark:ring-neutral-700"
				}`}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Drag handle indicator for mobile */}
				<div className="sm:hidden flex justify-center pt-3">
					<div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
				</div>

				{/* Close Button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 z-10 p-3 sm:p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors"
				>
					<svg
						className="w-5 h-5 sm:w-6 sm:h-6"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>

				{/* Header Section */}
				<div
					className={`p-6 sm:p-8 ${
						isHot
							? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
							: "bg-neutral-50 dark:bg-neutral-800/50"
					}`}
				>
					<div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
						{/* Company Logo */}
						<div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-white p-2 ring-2 ring-neutral-200 dark:ring-neutral-700">
							<Image
								src={job.company.logo}
								alt={job.company.name}
								width={96}
								height={96}
								className="object-contain w-full h-full"
								onError={(e) => {
									e.currentTarget.onerror = null;
									e.currentTarget.src = "/images/candidates/anonymous-placeholder.svg";
								}}
							/>
						</div>

						<div className="flex-1">
							<div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
								<h2 className="text-xl sm:text-3xl font-bold">{job.title}</h2>
								{job.featured && (
									<span className="text-lg text-amber-600 dark:text-amber-400">
										★
									</span>
								)}
								{isHot && (
									<span className="px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_10px_rgba(251,146,60,0.5)]">
										🔥 HOT
									</span>
								)}
							</div>
							<p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 mb-3">
								{job.company.name}
							</p>
							<div className="flex flex-wrap justify-center sm:justify-start gap-2">
								<span
									className={`px-3 py-1 text-sm rounded-full ${
										job.company.category === "portfolio"
											? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
											: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
									}`}
								>
									{job.company.category === "portfolio" ? "Portfolio" : "Network"}
								</span>
								{job.type && (
									<span className="px-3 py-1 text-sm rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
										{jobTypeLabels[job.type] ?? job.type}
									</span>
								)}
								<span className="px-3 py-1 text-sm rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
									{job.location}
								</span>
								{job.remote && (
									<span className="px-3 py-1 text-sm rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
										Remote OK
									</span>
								)}
								{job.department && (
									<span className="px-3 py-1 text-sm rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
										{job.department}
									</span>
								)}
								{job.salary && (
									<span className="px-3 py-1 text-sm rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
										{job.salary}
									</span>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Content Section - Scrollable */}
				<div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 sm:space-y-8">
					{/* Tags */}
					{job.tags && job.tags.length > 0 && (
						<div>
							<h3 className="text-lg font-semibold mb-3">Tags</h3>
							<div className="flex flex-wrap gap-2">
								{job.tags.map((tag) => (
									<span
										key={tag}
										className={`px-3 py-1.5 text-sm rounded-full ${
											tag === "hot"
												? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold"
												: tag === "top"
													? "bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold"
													: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
										}`}
									>
										{tagLabels[tag] ?? tag}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Description */}
					{job.description && (
						<div>
							<h3 className="text-lg font-semibold mb-3">About the Role</h3>
							<p className="text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line">
								{job.description}
							</p>
						</div>
					)}

					{/* Responsibilities */}
					{job.responsibilities && job.responsibilities.length > 0 && (
						<div>
							<h3 className="text-lg font-semibold mb-3">Responsibilities</h3>
							<ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-400">
								{job.responsibilities.map((item, index) => (
									<li key={index}>{item}</li>
								))}
							</ul>
						</div>
					)}

					{/* Qualifications */}
					{job.qualifications && job.qualifications.length > 0 && (
						<div>
							<h3 className="text-lg font-semibold mb-3">Qualifications</h3>
							<ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-400">
								{job.qualifications.map((item, index) => (
									<li key={index}>{item}</li>
								))}
							</ul>
						</div>
					)}

					{/* Benefits */}
					{job.benefits && job.benefits.length > 0 && (
						<div>
							<h3 className="text-lg font-semibold mb-3">Benefits</h3>
							<ul className="list-disc list-inside space-y-2 text-neutral-600 dark:text-neutral-400">
								{job.benefits.map((item, index) => (
									<li key={index}>{item}</li>
								))}
							</ul>
						</div>
					)}

				</div>

				{/* Footer - Sticky Apply Button */}
				<div className="flex-shrink-0 p-4 sm:p-6 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
					<div className="flex flex-col sm:flex-row items-center gap-4">
						{/* Apply Button */}
						<a
							href={job.link}
							target="_blank"
							rel="noopener noreferrer"
							className="w-full sm:w-auto px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors text-center"
						>
							Apply Now →
						</a>

						{/* Company Links */}
						<div className="flex items-center gap-3">
							<a
								href={job.company.website}
								target="_blank"
								rel="noopener noreferrer"
								className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
								title="Company Website"
								aria-label={`Visit ${job.company.name} website`}
							>
								<svg
									className="w-5 h-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<circle cx="12" cy="12" r="10" />
									<line x1="2" y1="12" x2="22" y2="12" />
									<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
								</svg>
							</a>
							{job.company.x && (
								<a
									href={job.company.x}
									target="_blank"
									rel="noopener noreferrer"
									className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
									title="X"
									aria-label={`Visit ${job.company.name} on X`}
								>
									<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
										<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
									</svg>
								</a>
							)}
							{job.company.github && (
								<a
									href={job.company.github}
									target="_blank"
									rel="noopener noreferrer"
									className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
									title="GitHub"
									aria-label={`Visit ${job.company.name} on GitHub`}
								>
									<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
									</svg>
								</a>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

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

interface JobsGridProps {
  jobs: Job[];
}

// Fisher-Yates shuffle (pure function - takes array and returns new shuffled array)
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function JobsGrid({ jobs }: JobsGridProps) {
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<JobTag[]>([]);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [shuffledJobs, setShuffledJobs] = useState<Job[]>([]);
  const [shuffledJobsKey, setShuffledJobsKey] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [expandedJob, setExpandedJob] = useState<Job | null>(null);

  // Mark as hydrated after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration flag set post-mount.
    setIsHydrated(true);
  }, []);

  // Handle escape key and body scroll for modal
  useEffect(() => {
    if (!expandedJob) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedJob(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [expandedJob]);

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

  // Get all unique locations from jobs (normalized)
  const allLocations = useMemo(() => {
    const locations = new Set<string>();
    jobs.forEach((job) => {
      // Check if job is remote
      if (job.remote) {
        locations.add("Remote");
      }
      // Add base location (first part before "/" or ",")
      const baseLocation = job.location.split(/[\/,]/)[0].trim();
      if (baseLocation && baseLocation.toLowerCase() !== "remote") {
        locations.add(baseLocation);
      }
    });
    return Array.from(locations).sort();
  }, [jobs]);

  const toggleTag = (tag: JobTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Category filter
      if (filterCategory !== "all" && job.company.category !== filterCategory) {
        return false;
      }

      // Company filter
      if (selectedCompany !== "all" && job.company.name !== selectedCompany) {
        return false;
      }

      // Location filter
      if (selectedLocation !== "all") {
        if (selectedLocation === "Remote") {
          if (!job.remote) {
            return false;
          }
        } else {
          if (!job.location.includes(selectedLocation)) {
            return false;
          }
        }
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
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const tagText = job.tags?.map((t) => tagLabels[t]).join(" ") || "";
        const searchableText = [
          job.title,
          job.company.name,
          job.location,
          job.department,
          tagText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [
    jobs,
    filterCategory,
    selectedCompany,
    selectedLocation,
    searchQuery,
    selectedTags,
  ]);

  const filterKey = useMemo(
    () =>
      [
        filterCategory,
        selectedCompany,
        selectedLocation,
        searchQuery,
        selectedTags.join(","),
      ].join("|"),
    [filterCategory, selectedCompany, selectedLocation, searchQuery, selectedTags],
  );

  // Helper to check if job is hot
  const isHotJob = (job: Job) => job.tags?.includes("hot");

  // Helper to get company tier (useCallback for stable reference in useEffect)
  const getTier = useCallback(
    (job: Job) =>
      companyTiers[job.company.name] ??
      (job.company.category === "portfolio" ? 4 : 5),
    [],
  );

  // Sort jobs deterministically (no shuffle - that happens in useEffect)
  const sortedJobs = useMemo(() => {
    const hot = filteredJobs.filter((j) => isHotJob(j));
    const featured = filteredJobs.filter((j) => j.featured && !isHotJob(j));
    const nonFeatured = filteredJobs.filter((j) => !j.featured && !isHotJob(j));

    // Group non-featured by tier
    const tierGroups: Record<number, Job[]> = {};
    nonFeatured.forEach((job) => {
      const tier = getTier(job);
      if (!tierGroups[tier]) tierGroups[tier] = [];
      tierGroups[tier].push(job);
    });

    // Combine tiers in order (deterministic)
    const sortedNonFeatured = Object.keys(tierGroups)
      .map(Number)
      .sort((a, b) => a - b)
      .flatMap((tier) => tierGroups[tier]);

    return [...hot, ...featured, ...sortedNonFeatured];
  }, [filteredJobs, getTier]);

  // Shuffle jobs in useEffect after hydration (React-safe)
  useEffect(() => {
    if (!isHydrated) return;

    const hot = filteredJobs.filter((j) => isHotJob(j));
    const featured = filteredJobs.filter((j) => j.featured && !isHotJob(j));
    const nonFeatured = filteredJobs.filter((j) => !j.featured && !isHotJob(j));

    // Shuffle each group
    const shuffledHot = shuffleArray(hot);
    const shuffledFeatured = shuffleArray(featured);

    // Group and shuffle non-featured by tier
    const tierGroups: Record<number, Job[]> = {};
    nonFeatured.forEach((job) => {
      const tier = getTier(job);
      if (!tierGroups[tier]) tierGroups[tier] = [];
      tierGroups[tier].push(job);
    });

    const sortedNonFeatured = Object.keys(tierGroups)
      .map(Number)
      .sort((a, b) => a - b)
      .flatMap((tier) => shuffleArray(tierGroups[tier]));

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Shuffle is derived after hydration.
    setShuffledJobs([
      ...shuffledHot,
      ...shuffledFeatured,
      ...sortedNonFeatured,
    ]);
    setShuffledJobsKey(filterKey);
  }, [filteredJobs, isHydrated, getTier, filterKey]);

  // Use shuffled jobs after hydration, otherwise use deterministic sort
  const displayJobs =
    isHydrated && shuffledJobs.length > 0 && shuffledJobsKey === filterKey
      ? shuffledJobs
      : sortedJobs;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        {/* Row 1: Category and Company filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="category-filter"
              className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
            >
              Type:
            </label>
            <CustomSelect
              id="category-filter"
              value={filterCategory}
              onChange={(value) => setFilterCategory(value as FilterCategory)}
              options={[
                { value: "all", label: "All" },
                { value: "portfolio", label: "Portfolio" },
                { value: "network", label: "Network" },
              ]}
              className="flex-1 sm:flex-none sm:min-w-[120px]"
            />
          </div>

          {/* Company Filter */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="company-filter"
              className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
            >
              Company:
            </label>
            <CustomSelect
              id="company-filter"
              value={selectedCompany}
              onChange={setSelectedCompany}
              options={[
                { value: "all", label: "All Companies" },
                ...allCompanies.map((company) => ({ value: company, label: company })),
              ]}
              className="flex-1 sm:flex-none sm:min-w-[160px]"
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
              onChange={setSelectedLocation}
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
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
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

        {/* Results count */}
        <div className="text-sm text-neutral-500">
          {sortedJobs.length} {sortedJobs.length === 1 ? "job" : "jobs"}
        </div>
      </div>

      {/* Tag Filters - Collapsible on mobile */}
      {allTags.length > 0 && (
        <div className="space-y-3">
          {/* Toggle button and selected tags */}
          <div className="flex flex-wrap items-center gap-2">
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
                  onClick={() => toggleTag(tag)}
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
                onClick={() => setSelectedTags([])}
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
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
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
        {sortedJobs.length === 0 ? (
          <p className="text-center py-8 text-neutral-500">
            No jobs found matching your criteria.
          </p>
        ) : (
          displayJobs.map((job) => (
            <div
              key={job.id}
              onClick={(e) => {
                // Don't open modal if clicking on nested links
                if ((e.target as HTMLElement).closest("a")) return;
                setExpandedJob(job);
              }}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${job.title} at ${job.company.name}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpandedJob(job);
                }
              }}
              className={`group block p-4 rounded-xl border transition-all cursor-pointer ${
                isHotJob(job)
                  ? "border-orange-400 dark:border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 shadow-[0_0_15px_rgba(251,146,60,0.3)] dark:shadow-[0_0_20px_rgba(251,146,60,0.2)] hover:shadow-[0_0_25px_rgba(251,146,60,0.5)] dark:hover:shadow-[0_0_30px_rgba(251,146,60,0.4)]"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Company Logo - centered and larger on mobile */}
                <div className="w-full sm:w-auto flex justify-center sm:justify-start">
                  <div className="w-20 h-20 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center">
                    <Image
                      src={job.company.logo}
                      alt={job.company.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain bg-white rounded-lg p-2 sm:p-1 group-hover:scale-[1.08] transition-transform duration-150"
                      onError={(e) => {
                        e.currentTarget.onerror = null; // Prevent infinite loop
                        console.warn(
                          `[JobsGrid] Failed to load logo for ${job.company.name}`,
                        );
                        e.currentTarget.src = "/images/candidates/anonymous-placeholder.svg";
                      }}
                    />
                  </div>
                </div>

                {/* Job Details */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                        {job.title}
                        {job.featured && (
                          <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                            ★
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
                        <span>{job.company.name}</span>
                        <span className="hidden sm:inline-flex items-center gap-1.5">
                          {/* Website */}
                          <a
                            href={job.company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                            title="Website"
                            aria-label={`Visit ${job.company.name} website`}
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                          </a>
                          {/* X */}
                          {job.company.x && (
                            <a
                              href={job.company.x}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                              title="X"
                              aria-label={`Visit ${job.company.name} on X`}
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                            </a>
                          )}
                          {/* GitHub */}
                          {job.company.github && (
                            <a
                              href={job.company.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                              title="GitHub"
                              aria-label={`Visit ${job.company.name} on GitHub`}
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                              </svg>
                            </a>
                          )}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`self-center sm:self-start flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${
                        job.company.category === "portfolio"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {job.company.category === "portfolio"
                        ? "Portfolio"
                        : "Network"}
                    </span>
                  </div>

                  {/* Meta info */}
                  <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs sm:text-sm text-neutral-500">
                    <span>{job.location}</span>
                    {job.type && (
                      <span className="capitalize">
                        {job.type.replace("-", " ")}
                      </span>
                    )}
                    {job.department && (
                      <span className="hidden sm:inline">{job.department}</span>
                    )}
                    {job.salary && <span>{job.salary}</span>}
                  </div>

                  {/* Tags - show all, CSS handles visibility */}
                  {job.tags && job.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-1">
                      {job.tags.map((tag, index) => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 text-xs rounded-full ${index >= 3 ? "hidden sm:inline-flex" : ""} ${
                            tag === "hot"
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-[0_0_10px_rgba(251,146,60,0.5)] animate-pulse"
                              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                          }`}
                        >
                          {tagLabels[tag] ?? tag}
                        </span>
                      ))}
                      {job.tags.length > 3 && (
                        <span className="sm:hidden px-2 py-0.5 text-xs text-neutral-500">
                          +{job.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Job Detail Modal */}
      {expandedJob && (
        <ExpandedJobView
          job={expandedJob}
          onClose={() => setExpandedJob(null)}
        />
      )}
    </div>
  );
}
