"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { Investment } from "@/data/investments";

type SortOption = "relevance" | "alphabetical" | "alphabetical-desc";

interface PortfolioGridProps {
	investments: Investment[];
}

export function PortfolioGrid({ investments }: PortfolioGridProps) {
	const [sortBy, setSortBy] = useState<SortOption>("relevance");
	const [showAll, setShowAll] = useState(false);
	const [shuffleKey, setShuffleKey] = useState(0);

	// Trigger shuffle only on client after hydration
	useEffect(() => {
		setShuffleKey(Math.random());
	}, []);

	const featuredCount = useMemo(
		() => investments.filter((i) => i.featured).length,
		[investments]
	);
	const hiddenCount = investments.length - featuredCount;

	const sortedInvestments = useMemo(() => {
		const filtered = showAll
			? investments
			: investments.filter((i) => i.featured);

		if (sortBy === "alphabetical") {
			return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
		}
		if (sortBy === "alphabetical-desc") {
			return [...filtered].sort((a, b) => b.title.localeCompare(a.title));
		}

		// Relevance: group by tier, shuffle within each tier
		const tierGroups: Record<number, Investment[]> = {};
		filtered.forEach((inv) => {
			if (!tierGroups[inv.tier]) tierGroups[inv.tier] = [];
			tierGroups[inv.tier].push(inv);
		});

		// Shuffle each tier group (only after hydration)
		if (shuffleKey > 0) {
			Object.values(tierGroups).forEach((group) => {
				for (let i = group.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[group[i], group[j]] = [group[j], group[i]];
				}
			});
		}

		// Combine tiers in order
		return Object.keys(tierGroups)
			.map(Number)
			.sort((a, b) => a - b)
			.flatMap((tier) => tierGroups[tier]);
	}, [investments, sortBy, showAll, shuffleKey]);

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

				{hiddenCount > 0 && (
					<button
						onClick={() => setShowAll(!showAll)}
						className="px-4 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
					>
						{showAll ? (
							<>Show Featured ({featuredCount})</>
						) : (
							<>Show All ({investments.length})</>
						)}
					</button>
				)}
			</div>

			{/* Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{sortedInvestments.map((investment) => (
					<a
						key={investment.title}
						href={investment.imageUrl}
						target="_blank"
						rel="noopener noreferrer"
						className={`group p-6 rounded-xl border transition-colors flex flex-col items-center text-center ${
							investment.tier === 1
								? "border-neutral-300 dark:border-neutral-600 hover:border-neutral-500 dark:hover:border-neutral-400"
								: investment.tier === 3
									? "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 opacity-80"
									: "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
						}`}
					>
						<div className="w-24 h-24 mb-4 flex items-center justify-center">
							<Image
								src={investment.logo}
								alt={investment.title}
								width={80}
								height={80}
								className="object-contain bg-white rounded-lg p-2 group-hover:scale-105 transition-transform"
							/>
						</div>
						<h3 className="font-semibold mb-2">
							{investment.title}
							{investment.tier === 1 && (
								<span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
									★
								</span>
							)}
						</h3>
						<p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
							{investment.description}
						</p>
						{/* Social Links */}
						<div className="flex items-center gap-3">
							{/* Website */}
							<span
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									window.open(investment.imageUrl, "_blank");
								}}
								className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
								title="Website"
							>
								<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<circle cx="12" cy="12" r="10" />
									<line x1="2" y1="12" x2="22" y2="12" />
									<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
								</svg>
							</span>
							{/* X (Twitter) */}
							{investment.x && (
								<span
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										window.open(investment.x, "_blank");
									}}
									className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
									title="X (Twitter)"
								>
									<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
										<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
									</svg>
								</span>
							)}
							{/* GitHub */}
							{investment.github && (
								<span
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										window.open(investment.github, "_blank");
									}}
									className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer"
									title="GitHub"
								>
									<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
									</svg>
								</span>
							)}
						</div>
					</a>
				))}
			</div>

			{/* Show more hint when collapsed - clickable */}
			{!showAll && hiddenCount > 0 && (
				<button
					onClick={() => setShowAll(true)}
					className="w-full text-center text-sm text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
				>
					+{hiddenCount} more investments
				</button>
			)}
		</div>
	);
}
