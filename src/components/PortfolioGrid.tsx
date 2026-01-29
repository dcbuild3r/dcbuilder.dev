"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";

// Investment interface matching what comes from the database
interface Investment {
	id?: string;
	title: string;
	description: string | null;
	imageUrl: string | null;
	logo: string | null;
	tier: 1 | 2 | 3 | 4;
	featured: boolean;
	status?: string | null;
	website?: string | null;
	x?: string | null;
	github?: string | null;
	createdAt?: string | Date | null;
}

// Check if item was created within the last 2 weeks
const isNew = (createdAt: string | Date | null | undefined): boolean => {
	if (!createdAt) return false;
	const date = new Date(createdAt);
	const twoWeeksAgo = new Date();
	twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
	return date > twoWeeksAgo;
};

type SortOption = "relevance" | "alphabetical" | "alphabetical-desc";

interface PortfolioGridProps {
	investments: Investment[];
}

// Fisher-Yates shuffle (pure function)
function shuffleArray<T>(array: T[]): T[] {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

type FilterOption = "main" | "featured" | "all";

export function PortfolioGrid({ investments }: PortfolioGridProps) {
	const [sortBy, setSortBy] = useState<SortOption>("relevance");
	const [filter, setFilter] = useState<FilterOption>("all");
	const [shuffledInvestments, setShuffledInvestments] = useState<Investment[]>(
		[]
	);
	const [isHydrated, setIsHydrated] = useState(false);

	// Mark as hydrated after mount
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration flag set post-mount.
		setIsHydrated(true);
	}, []);

	// Count investments by category
	const mainCount = useMemo(
		() => investments.filter((i) => i.tier <= 3).length,
		[investments]
	);
	const featuredCount = useMemo(
		() => investments.filter((i) => i.featured).length,
		[investments]
	);
	const tier4Count = investments.length - mainCount;

	// Filtered investments based on filter option
	const filteredInvestments = useMemo(() => {
		if (filter === "featured") return investments.filter((i) => i.featured);
		if (filter === "all") return investments;
		// Default "main": show tier 1, 2, 3 (hide tier 4)
		return investments.filter((i) => i.tier <= 3);
	}, [investments, filter]);

	// Deterministic sort (no shuffle - that happens in useEffect)
	// Defunct companies always go last
	const sortedInvestments = useMemo(() => {
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

		// Relevance: featured first (by tier), then non-featured (by tier), defunct last
		const featured = active.filter((i) => i.featured);
		const nonFeatured = active.filter((i) => !i.featured);

		// Sort featured by tier
		const sortedFeatured = featured.sort((a, b) => a.tier - b.tier);

		// Group non-featured by tier
		const tierGroups: Record<number, Investment[]> = {};
		nonFeatured.forEach((inv) => {
			if (!tierGroups[inv.tier]) tierGroups[inv.tier] = [];
			tierGroups[inv.tier].push(inv);
		});

		const sortedNonFeatured = Object.keys(tierGroups)
			.map(Number)
			.sort((a, b) => a - b)
			.flatMap((tier) => tierGroups[tier]);

		return [...sortedFeatured, ...sortedNonFeatured, ...defunct];
	}, [filteredInvestments, sortBy]);

	// Shuffle in useEffect after hydration (React-safe)
	// Defunct companies always go last
	useEffect(() => {
		if (!isHydrated || sortBy !== "relevance") {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- Reset shuffle when not using relevance.
			setShuffledInvestments([]);
			return;
		}

		const active = filteredInvestments.filter((i) => i.status !== "defunct");
		const defunct = filteredInvestments.filter((i) => i.status === "defunct");

		// Featured first (shuffled within tier groups), then non-featured (shuffled within tier groups)
		const featured = active.filter((i) => i.featured);
		const nonFeatured = active.filter((i) => !i.featured);

		// Group featured by tier and shuffle each group
		const featuredTierGroups: Record<number, Investment[]> = {};
		featured.forEach((inv) => {
			if (!featuredTierGroups[inv.tier]) featuredTierGroups[inv.tier] = [];
			featuredTierGroups[inv.tier].push(inv);
		});

		const shuffledFeatured = Object.keys(featuredTierGroups)
			.map(Number)
			.sort((a, b) => a - b)
			.flatMap((tier) => shuffleArray(featuredTierGroups[tier]));

		// Group non-featured by tier and shuffle each group
		const tierGroups: Record<number, Investment[]> = {};
		nonFeatured.forEach((inv) => {
			if (!tierGroups[inv.tier]) tierGroups[inv.tier] = [];
			tierGroups[inv.tier].push(inv);
		});

		const shuffledNonFeatured = Object.keys(tierGroups)
			.map(Number)
			.sort((a, b) => a - b)
			.flatMap((tier) => shuffleArray(tierGroups[tier]));

		setShuffledInvestments([...shuffledFeatured, ...shuffledNonFeatured, ...shuffleArray(defunct)]);
	}, [filteredInvestments, sortBy, isHydrated]);

	// Use shuffled for relevance after hydration, otherwise use deterministic sort
	const displayInvestments =
		isHydrated && sortBy === "relevance" && shuffledInvestments.length > 0
			? shuffledInvestments
			: sortedInvestments;

	// Split into active and defunct for rendering with separator
	const activeInvestments = displayInvestments.filter((i) => i.status !== "defunct");
	const defunctInvestments = displayInvestments.filter((i) => i.status === "defunct");

	return (
		<div className="space-y-6">
			{/* Controls */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2">
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

				<div className="flex items-center gap-2">
					<button
						onClick={() => setFilter("main")}
						className={`px-4 py-1.5 text-sm rounded-lg border transition-colors ${
							filter === "main"
								? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent"
								: "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
						}`}
					>
						Main ({mainCount})
					</button>
					<button
						onClick={() => setFilter("featured")}
						className={`px-4 py-1.5 text-sm rounded-lg border transition-colors ${
							filter === "featured"
								? "bg-amber-500 text-white border-transparent"
								: "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
						}`}
					>
						★ Featured ({featuredCount})
					</button>
					{tier4Count > 0 && (
						<button
							onClick={() => setFilter("all")}
							className={`px-4 py-1.5 text-sm rounded-lg border transition-colors ${
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

			{/* Grid - Active Investments */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{activeInvestments.map((investment) => (
					<div
						key={investment.title}
						onClick={(e) => {
							// Don't navigate if clicking on nested links
							if ((e.target as HTMLElement).closest('a')) return;
							if (investment.website) window.open(investment.website, '_blank', 'noopener,noreferrer');
						}}
						role="link"
						tabIndex={0}
						aria-label={`View ${investment.title} website`}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								if (investment.website) window.open(investment.website, '_blank', 'noopener,noreferrer');
							}
						}}
						className={`group p-6 rounded-xl border transition-colors flex flex-col items-center text-center cursor-pointer ${
							investment.tier === 1
								? "border-neutral-300 dark:border-neutral-600 hover:border-neutral-500 dark:hover:border-neutral-400"
								: investment.tier === 3
									? "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 opacity-80"
									: "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
						}`}
					>
						<div className="w-32 h-32 sm:w-24 sm:h-24 mb-4 flex items-center justify-center">
							{investment.logo && (
								<Image
									src={investment.logo}
									alt={investment.title}
									width={120}
									height={120}
									className={`w-28 h-28 sm:w-20 sm:h-20 object-contain bg-white rounded-lg p-2 group-hover:scale-[1.08] transition-transform duration-150 ${
										investment.status === "defunct" ? "grayscale opacity-80" : ""
									}`}
									onError={(e) => {
										console.warn(
											`[PortfolioGrid] Failed to load logo for ${investment.title}`
										);
										e.currentTarget.style.display = "none";
									}}
								/>
							)}
						</div>
						<h3 className="font-semibold mb-2">
							{investment.title}
							{investment.featured && (
								<span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
									★
								</span>
							)}
							{isNew(investment.createdAt) && (
								<span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 animate-pulse-new">
									NEW
								</span>
							)}
						</h3>
						{investment.status === "defunct" && (
							<span className="inline-block px-2 py-0.5 mb-2 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
								Ceased Operations
							</span>
						)}
						<p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
							{investment.description}
						</p>
						{/* Social Links */}
						<div className="flex items-center gap-1">
							{/* Website */}
							{investment.website && (
								<a
									href={investment.website}
									target="_blank"
									rel="noopener noreferrer"
									className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
									title="Website"
									aria-label={`Visit ${investment.title} website`}
								>
								<svg
									className="w-5 h-5 sm:w-4 sm:h-4"
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
							)}
							{/* X */}
							{investment.x && (
								<a
									href={investment.x}
									target="_blank"
									rel="noopener noreferrer"
									className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
									title="X"
									aria-label={`Visit ${investment.title} on X`}
								>
									<svg className="w-5 h-5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
										<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
									</svg>
								</a>
							)}
							{/* GitHub */}
							{investment.github && (
								<a
									href={investment.github}
									target="_blank"
									rel="noopener noreferrer"
									className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
									title="GitHub"
									aria-label={`Visit ${investment.title} on GitHub`}
								>
									<svg className="w-5 h-5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
									</svg>
								</a>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Separator GIF between active and defunct */}
			{defunctInvestments.length > 0 && (
				<div className="flex justify-center py-4">
					<img
						src="https://i.pinimg.com/originals/bc/c7/ab/bcc7abc844aa8be1abc46a9f5d3c22c5.gif"
						alt="Separator"
						className="w-[512px] h-[512px] object-contain"
					/>
				</div>
			)}

			{/* Grid - Defunct Investments */}
			{defunctInvestments.length > 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{defunctInvestments.map((investment) => (
						<div
							key={investment.title}
							onClick={(e) => {
								if ((e.target as HTMLElement).closest('a')) return;
								if (investment.website) window.open(investment.website, '_blank', 'noopener,noreferrer');
							}}
							role="link"
							tabIndex={0}
							aria-label={`View ${investment.title} website`}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									if (investment.website) window.open(investment.website, '_blank', 'noopener,noreferrer');
								}
							}}
							className="group p-6 rounded-xl border transition-colors flex flex-col items-center text-center cursor-pointer border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
						>
							<div className="w-32 h-32 sm:w-24 sm:h-24 mb-4 flex items-center justify-center">
								{investment.logo && (
									<Image
										src={investment.logo}
										alt={investment.title}
										width={120}
										height={120}
										className="w-28 h-28 sm:w-20 sm:h-20 object-contain bg-white rounded-lg p-2 group-hover:scale-[1.08] transition-transform duration-150 grayscale opacity-80"
										onError={(e) => {
											console.warn(`[PortfolioGrid] Failed to load logo for ${investment.title}`);
											e.currentTarget.style.display = "none";
										}}
									/>
								)}
							</div>
							<h3 className="font-semibold mb-2">{investment.title}</h3>
							<span className="inline-block px-2 py-0.5 mb-2 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
								Ceased Operations
							</span>
							<p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
								{investment.description}
							</p>
							<div className="flex items-center gap-1">
								{investment.website && (
									<a
										href={investment.website}
										target="_blank"
										rel="noopener noreferrer"
										className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
										title="Website"
										aria-label={`Visit ${investment.title} website`}
									>
										<svg className="w-5 h-5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<circle cx="12" cy="12" r="10" />
											<line x1="2" y1="12" x2="22" y2="12" />
											<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
										</svg>
									</a>
								)}
								{investment.x && (
									<a
										href={investment.x}
										target="_blank"
										rel="noopener noreferrer"
										className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
										title="X"
										aria-label={`Visit ${investment.title} on X`}
									>
										<svg className="w-5 h-5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
											<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
										</svg>
									</a>
								)}
								{investment.github && (
									<a
										href={investment.github}
										target="_blank"
										rel="noopener noreferrer"
										className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
										title="GitHub"
										aria-label={`Visit ${investment.title} on GitHub`}
									>
										<svg className="w-5 h-5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
											<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
										</svg>
									</a>
								)}
							</div>
						</div>
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
