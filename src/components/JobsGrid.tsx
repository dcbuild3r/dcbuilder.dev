"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Markdown from "react-markdown";
import { Job, JobTag, RelationshipCategory, tagLabels as defaultTagLabels } from "@/data/jobs";
import { CustomSelect } from "./CustomSelect";
import { CustomMultiSelect } from "./CustomMultiSelect";
import {
	trackJobView,
	trackJobApplyClick,
	trackJobDetailsClick,
} from "@/lib/posthog";

// Job type labels for display
const jobTypeLabels: Record<string, string> = {
	"full-time": "Full-time",
	"part-time": "Part-time",
	contract: "Contract",
	internship: "Internship",
};

// Check if item was created within the last 2 weeks
const isNewItem = (createdAt: string | Date | undefined): boolean => {
	if (!createdAt) return false;
	const created = new Date(createdAt);
	const twoWeeksAgo = new Date();
	twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
	return created > twoWeeksAgo;
};

type JobDescriptionContent = {
	description?: string;
};

const jobDescriptionCache = new Map<string, JobDescriptionContent>();

// Expanded Job View Component
function ExpandedJobView({
	job,
	onClose,
	jobUrl,
	onViewOtherJobs,
	otherJobsCount,
	onApplyClick,
	tagLabels,
}: {
	job: Job;
	onClose: () => void;
	jobUrl: string;
	onViewOtherJobs: () => void;
	otherJobsCount: number;
	onApplyClick?: () => void;
	tagLabels: Record<string, string>;
}) {
	const isHot = job.tags?.includes("hot");
	const [copiedLink, setCopiedLink] = useState<"job" | "apply" | null>(null);
	const [enrichedContent, setEnrichedContent] =
		useState<JobDescriptionContent | null>(null);
	const [isEnriching, setIsEnriching] = useState(false);
	// Only enrich if we have no description at all
	const missingSections = !job.description;

	useEffect(() => {
		setEnrichedContent(null);
		if (!missingSections) return;

		const cached = jobDescriptionCache.get(job.id);
		if (cached) {
			setEnrichedContent(cached);
			return;
		}

		let cancelled = false;
		const enrich = async () => {
			setIsEnriching(true);
			try {
				const response = await fetch(
					`/api/job-description?url=${encodeURIComponent(job.link)}`,
				);
				if (!response.ok) return;
				const data = (await response.json()) as JobDescriptionContent;
				if (!cancelled) {
					jobDescriptionCache.set(job.id, data);
					setEnrichedContent(data);
				}
			} catch (error) {
				console.warn("[JobsGrid] Failed to enrich job description", error);
			} finally {
				if (!cancelled) setIsEnriching(false);
			}
		};

		void enrich();

		return () => {
			cancelled = true;
		};
	}, [job.id, job.link, missingSections]);

	const loadingLabel = "Fetching details from job link...";
	const defaultBullet = "Details will be shared during the process.";
	const description =
		job.description?.trim() ||
		enrichedContent?.description?.trim() ||
		(isEnriching ? loadingLabel : defaultBullet);

	const copyToClipboard = async (text: string, type: "job" | "apply") => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedLink(type);
			setTimeout(() => setCopiedLink(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className={`relative w-full sm:max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden ${
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
						<div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-white p-2 ring-2 ring-neutral-200 dark:ring-neutral-700 hover:scale-[1.08] transition-transform duration-150">
							<Image
								src={job.company.logo || "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/anonymous-placeholder.svg"}
								alt={job.company.name}
								width={96}
								height={96}
								className="object-contain w-full h-full"
								onError={(e) => {
									e.currentTarget.onerror = null;
									e.currentTarget.src = "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/anonymous-placeholder.svg";
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
								{isNewItem(job.createdAt) && (
									<span className="px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 animate-pulse-new">
										NEW
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
										{tagLabels[tag as JobTag] ?? tag}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Description */}
					<div>
						<h3 className="text-lg font-semibold mb-3">About the Role</h3>
						<div className="prose-jd">
							<Markdown>{description}</Markdown>
						</div>
					</div>


				</div>

				{/* Footer - Sticky Apply Button */}
				<div className="flex-shrink-0 p-4 sm:p-6 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
					<div className="flex flex-col sm:flex-row items-center gap-4">
						{/* Apply Button */}
						<a
							href={job.link}
							target="_blank"
							rel="noopener noreferrer"
							onClick={onApplyClick}
							className="w-full sm:w-auto px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors text-center"
						>
							Apply Now →
						</a>

						{/* Copy Buttons */}
						<div className="flex items-center gap-2">
							<button
								onClick={() => copyToClipboard(jobUrl, "job")}
								className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
								title="Copy job link"
							>
								{copiedLink === "job" ? (
									<>
										<svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<polyline points="20 6 9 17 4 12" />
										</svg>
										<span className="text-green-600 dark:text-green-400">Copied!</span>
									</>
								) : (
									<>
										<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
											<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
										</svg>
										<span className="hidden sm:inline">Copy link</span>
									</>
								)}
							</button>
							<button
								onClick={() => copyToClipboard(job.link, "apply")}
								className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
								title="Copy application link"
							>
								{copiedLink === "apply" ? (
									<>
										<svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<polyline points="20 6 9 17 4 12" />
										</svg>
										<span className="text-green-600 dark:text-green-400">Copied!</span>
									</>
								) : (
									<>
										<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
											<polyline points="15 3 21 3 21 9" />
											<line x1="10" y1="14" x2="21" y2="3" />
										</svg>
										<span className="hidden sm:inline">Copy apply link</span>
									</>
								)}
							</button>
						</div>

						{/* Other Jobs & Careers */}
						<div className="flex items-center gap-2">
							{otherJobsCount > 0 && (
								<button
									onClick={onViewOtherJobs}
									className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
								>
									<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<rect x="3" y="3" width="7" height="7" />
										<rect x="14" y="3" width="7" height="7" />
										<rect x="14" y="14" width="7" height="7" />
										<rect x="3" y="14" width="7" height="7" />
									</svg>
									<span className="hidden sm:inline">{otherJobsCount} more {otherJobsCount === 1 ? "job" : "jobs"}</span>
									<span className="sm:hidden">+{otherJobsCount}</span>
								</button>
							)}
							{job.company.careers && (
								<a
									href={job.company.careers}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
									title="View all open positions"
								>
									<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
										<circle cx="12" cy="7" r="4" />
									</svg>
									<span className="hidden sm:inline">Careers page</span>
								</a>
							)}
						</div>

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

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let current = seed;
  return () => {
    current = (current * 9301 + 49297) % 233280;
    return current / 233280;
  };
}

// Fisher-Yates shuffle with deterministic RNG
function shuffleArray<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function JobsGrid({ jobs, tagDefinitions = [], roleDefinitions = [] }: JobsGridProps) {
  // Build tag labels from definitions (with fallback to hardcoded)
  const tagLabels = useMemo(() => {
    const labels: Record<string, string> = { ...defaultTagLabels };
    tagDefinitions.forEach((tag) => {
      labels[tag.slug] = tag.label;
    });
    return labels;
  }, [tagDefinitions]);

  // Build tag colors from definitions
  const tagColors = useMemo(() => {
    const colors: Record<string, string | null> = {};
    tagDefinitions.forEach((tag) => {
      colors[tag.slug] = tag.color;
    });
    return colors;
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
  }, [searchParams]);

  const [filterCategory, setFilterCategory] = useState<FilterCategory>(initialParams.filterCategory);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(initialParams.selectedCompanies);
  const [selectedRole, setSelectedRole] = useState<string>(initialParams.selectedRole);
  const [selectedLocation, setSelectedLocation] = useState<string>(initialParams.selectedLocation);
  const [searchQuery, setSearchQuery] = useState(initialParams.searchQuery);
  const [selectedTags, setSelectedTags] = useState<JobTag[]>(initialParams.selectedTags);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(initialParams.showFeaturedOnly);
  const [expandedJob, setExpandedJob] = useState<Job | null>(() => {
    if (!initialParams.jobId) return null;
    return jobs.find((job) => job.id === initialParams.jobId) ?? null;
  });
  const [dataHotJobIds, setDataHotJobIds] = useState<Set<string>>(new Set());

  // Fetch data-driven hot jobs from analytics
  useEffect(() => {
    fetch("/api/hot-jobs")
      .then((res) => res.json())
      .then((data) => {
        if (data.hotJobIds) {
          setDataHotJobIds(new Set(data.hotJobIds));
        }
      })
      .catch((error) => console.warn("Failed to fetch hot jobs:", error));
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

  // Helper to update URL params without React re-render
  const updateUrlParams = useCallback((updates: Record<string, string | null>) => {
    const url = new URL(window.location.href);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    window.history.replaceState(null, "", url.pathname + url.search);
  }, []);

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
    // Update URL with multiple company params
    const url = new URL(window.location.href);
    url.searchParams.delete("company");
    if (values.length > 0) {
      values.forEach((v) => url.searchParams.append("company", v));
    }
    window.history.replaceState(null, "", url.pathname + url.search);
  }, []);

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
    updateUrlParams({ q: value || null });
  }, [updateUrlParams]);

  const handleFeaturedToggle = useCallback(() => {
    const newValue = !showFeaturedOnly;
    setShowFeaturedOnly(newValue);
    updateUrlParams({ featured: newValue ? "1" : null });
  }, [showFeaturedOnly, updateUrlParams]);

  const handleTagToggle = useCallback((tag: JobTag) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];
      // Use setTimeout to avoid updating URL during render
      setTimeout(() => {
        updateUrlParams({ tags: newTags.length > 0 ? newTags.join(",") : null });
      }, 0);
      return newTags;
    });
  }, [updateUrlParams]);

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
    // Clear all filter params from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("type");
    url.searchParams.delete("company");
    url.searchParams.delete("role");
    url.searchParams.delete("location");
    url.searchParams.delete("q");
    url.searchParams.delete("tags");
    url.searchParams.delete("featured");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, []);

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
    selectedCompanies,
    selectedRole,
    selectedLocation,
    searchQuery,
    selectedTags,
    showFeaturedOnly,
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
        searchQuery,
        selectedTags.join(","),
        showFeaturedOnly,
        shuffleSeed,
      ].join("|"),
    [filterCategory, selectedCompanies, selectedRole, selectedLocation, searchQuery, selectedTags, showFeaturedOnly, shuffleSeed],
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

  return (
    <div className="space-y-6">
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
        {displayJobs.length === 0 ? (
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
              className={`group block p-4 rounded-xl border transition-all cursor-pointer ${
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
                  {/* Row 1: Title and company */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
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
                        {isNewItem(job.createdAt) && (
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
                      className={`self-center sm:self-start flex-shrink-0 px-2.5 py-1 text-sm rounded-full ${
                        job.company.category === "portfolio"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {job.company.category === "portfolio" ? "Portfolio" : "Network"}
                    </span>
                  </div>

                  {/* Row 2: Location */}
                  <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs sm:text-sm text-neutral-500">
                    <span>{job.location}</span>
                    {job.type && (
                      <span className="capitalize">{job.type.replace("-", " ")}</span>
                    )}
                    {job.salary && <span>{job.salary}</span>}
                  </div>

                  {/* Row 3: Tags + Buttons */}
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                    {/* Tags (excluding "hot" which is shown next to title) */}
                    {job.tags && job.tags.filter(t => t !== "hot").length > 0 && (
                      <div className="flex flex-wrap justify-center sm:justify-start gap-1">
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

                    {/* Spacer */}
                    <div className="hidden sm:block flex-1" />

                    {/* Buttons */}
                    <div className="flex items-center justify-center sm:justify-end gap-2">
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
            </div>
          ))
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
