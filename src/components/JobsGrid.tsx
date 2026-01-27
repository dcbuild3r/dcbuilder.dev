"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Job, JobTag, RelationshipCategory, tagLabels } from "@/data/jobs";

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
	const [shuffledJobs, setShuffledJobs] = useState<Job[]>([]);
	const [isHydrated, setIsHydrated] = useState(false);

	// Mark as hydrated after mount
	useEffect(() => {
		setIsHydrated(true);
	}, []);

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
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
		);
	};

	const filteredJobs = useMemo(() => {
		return jobs.filter((job) => {
			// Category filter
			if (
				filterCategory !== "all" &&
				job.company.category !== filterCategory
			) {
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
				if (!job.tags || !selectedTags.every((tag) => job.tags?.includes(tag))) {
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
	}, [jobs, filterCategory, selectedCompany, selectedLocation, searchQuery, selectedTags]);

	// Helper to check if job is hot
	const isHotJob = (job: Job) => job.tags?.includes("hot");

	// Helper to get company tier
	const getTier = (job: Job) =>
		companyTiers[job.company.name] ??
		(job.company.category === "portfolio" ? 4 : 5);

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
	}, [filteredJobs]);

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

		setShuffledJobs([...shuffledHot, ...shuffledFeatured, ...sortedNonFeatured]);
	}, [filteredJobs, isHydrated]);

	// Use shuffled jobs after hydration, otherwise use deterministic sort
	const displayJobs = isHydrated && shuffledJobs.length > 0 ? shuffledJobs : sortedJobs;

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="flex flex-wrap items-center gap-4">
				{/* Category Filter */}
				<div className="flex items-center gap-2">
					<label
						htmlFor="category-filter"
						className="text-sm text-neutral-600 dark:text-neutral-400"
					>
						Type:
					</label>
					<select
						id="category-filter"
						value={filterCategory}
						onChange={(e) =>
							setFilterCategory(e.target.value as FilterCategory)
						}
						className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
					>
						<option value="all">All</option>
						<option value="portfolio">Portfolio</option>
						<option value="network">Network</option>
					</select>
				</div>

				{/* Company Filter */}
				<div className="flex items-center gap-2">
					<label
						htmlFor="company-filter"
						className="text-sm text-neutral-600 dark:text-neutral-400"
					>
						Company:
					</label>
					<select
						id="company-filter"
						value={selectedCompany}
						onChange={(e) => setSelectedCompany(e.target.value)}
						className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
					>
						<option value="all">All Companies</option>
						{allCompanies.map((company) => (
							<option key={company} value={company}>
								{company}
							</option>
						))}
					</select>
				</div>

				{/* Location Filter */}
				<div className="flex items-center gap-2">
					<label
						htmlFor="location-filter"
						className="text-sm text-neutral-600 dark:text-neutral-400"
					>
						Location:
					</label>
					<select
						id="location-filter"
						value={selectedLocation}
						onChange={(e) => setSelectedLocation(e.target.value)}
						className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
					>
						<option value="all">All Locations</option>
						{allLocations.map((location) => (
							<option key={location} value={location}>
								{location}
							</option>
						))}
					</select>
				</div>

				{/* Search */}
				<div className="flex-1 min-w-[200px]">
					<input
						type="text"
						placeholder="Search jobs..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
					/>
				</div>

				{/* Results count */}
				<span className="text-sm text-neutral-500">
					{sortedJobs.length} {sortedJobs.length === 1 ? "job" : "jobs"}
				</span>
			</div>

			{/* Tag Filters */}
			{allTags.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{allTags.map((tag) => (
						<button
							key={tag}
							onClick={() => toggleTag(tag)}
							className={`px-3 py-1 text-sm rounded-full transition-all ${
								tag === "hot"
									? selectedTags.includes(tag)
										? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-[0_0_15px_rgba(251,146,60,0.6)]"
										: "bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold shadow-[0_0_10px_rgba(251,146,60,0.4)] hover:shadow-[0_0_15px_rgba(251,146,60,0.6)]"
									: selectedTags.includes(tag)
										? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
										: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
							}`}
						>
							{tagLabels[tag]}
						</button>
					))}
					{selectedTags.length > 0 && (
						<button
							onClick={() => setSelectedTags([])}
							className="px-3 py-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
						>
							Clear
						</button>
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
						<a
							key={job.id}
							href={job.link}
							target="_blank"
							rel="noopener noreferrer"
							className={`group block p-4 rounded-xl border transition-all ${
								isHotJob(job)
									? "border-orange-400 dark:border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 shadow-[0_0_15px_rgba(251,146,60,0.3)] dark:shadow-[0_0_20px_rgba(251,146,60,0.2)] hover:shadow-[0_0_25px_rgba(251,146,60,0.5)] dark:hover:shadow-[0_0_30px_rgba(251,146,60,0.4)]"
									: "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
							}`}
						>
							<div className="flex items-start gap-4">
								{/* Company Logo */}
								<div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
									<Image
										src={job.company.logo}
										alt={job.company.name}
										width={48}
										height={48}
										className="object-contain bg-white rounded-lg p-1 group-hover:scale-105 transition-transform"
										onError={(e) => {
											console.warn(`[JobsGrid] Failed to load logo for ${job.company.name}`);
											e.currentTarget.style.display = "none";
										}}
									/>
								</div>

								{/* Job Details */}
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between gap-2">
										<div>
											<h3 className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
												{job.title}
												{job.featured && (
													<span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
														★
													</span>
												)}
											</h3>
											<p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
												{job.company.name}
												<span className="inline-flex items-center gap-1.5">
													{/* Website */}
													<a
														href={job.company.website}
														target="_blank"
														rel="noopener noreferrer"
														onClick={(e) => e.stopPropagation()}
														className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
														title="Website"
													>
														<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
															<circle cx="12" cy="12" r="10" />
															<line x1="2" y1="12" x2="22" y2="12" />
															<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
														</svg>
													</a>
													{/* X (Twitter) */}
													{job.company.x && (
														<a
															href={job.company.x}
															target="_blank"
															rel="noopener noreferrer"
															onClick={(e) => e.stopPropagation()}
															className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
															title="X (Twitter)"
														>
															<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
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
															onClick={(e) => e.stopPropagation()}
															className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
															title="GitHub"
														>
															<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
																<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
															</svg>
														</a>
													)}
												</span>
											</p>
										</div>
										<span
											className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${
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
									<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
										<span>{job.location}</span>
										{job.type && (
											<span className="capitalize">
												{job.type.replace("-", " ")}
											</span>
										)}
										{job.department && <span>{job.department}</span>}
										{job.salary && <span>{job.salary}</span>}
									</div>

									{/* Tags */}
									{job.tags && job.tags.length > 0 && (
										<div className="mt-2 flex flex-wrap gap-1">
											{job.tags.map((tag) => (
												<span
													key={tag}
													className={`px-2 py-0.5 text-xs rounded-full ${
														tag === "hot"
															? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-[0_0_10px_rgba(251,146,60,0.5)] animate-pulse"
															: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
													}`}
												>
													{tagLabels[tag] ?? tag}
												</span>
											))}
										</div>
									)}
								</div>
							</div>
						</a>
					))
				)}
			</div>
		</div>
	);
}
