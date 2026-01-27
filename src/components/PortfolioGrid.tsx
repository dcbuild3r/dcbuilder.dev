"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Investment } from "@/data/investments";

type SortOption = "relevance" | "alphabetical" | "alphabetical-desc";

interface PortfolioGridProps {
	investments: Investment[];
}

export function PortfolioGrid({ investments }: PortfolioGridProps) {
	const [sortBy, setSortBy] = useState<SortOption>("relevance");
	const [showAll, setShowAll] = useState(false);

	const featuredCount = useMemo(
		() => investments.filter((i) => i.featured).length,
		[investments]
	);
	const hiddenCount = investments.length - featuredCount;

	const sortedInvestments = useMemo(() => {
		const filtered = showAll
			? investments
			: investments.filter((i) => i.featured);

		return [...filtered].sort((a, b) => {
			switch (sortBy) {
				case "relevance":
					// Sort by tier first (lower tier number = higher priority)
					if (a.tier !== b.tier) return a.tier - b.tier;
					// Then alphabetically within same tier
					return a.title.localeCompare(b.title);
				case "alphabetical":
					return a.title.localeCompare(b.title);
				case "alphabetical-desc":
					return b.title.localeCompare(a.title);
				default:
					return 0;
			}
		});
	}, [investments, sortBy, showAll]);

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
						<p className="text-sm text-neutral-600 dark:text-neutral-400">
							{investment.description}
						</p>
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
