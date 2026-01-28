"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { AggregatedNewsItem } from "@/lib/news";
import { NewsCategory, categoryLabels } from "@/data/news";
import { CustomSelect } from "./CustomSelect";

type NewsType = "all" | "blog" | "curated" | "announcement";

const typeLabels: Record<NewsType, string> = {
	all: "All",
	blog: "Blog Posts",
	curated: "Curated Links",
	announcement: "Announcements",
};

interface NewsGridProps {
	news: AggregatedNewsItem[];
}

export function NewsGrid({ news }: NewsGridProps) {
	const [typeFilter, setTypeFilter] = useState<NewsType>("all");
	const [categoryFilter, setCategoryFilter] = useState<"all" | NewsCategory>("all");
	const [searchQuery, setSearchQuery] = useState("");

	// Get all unique categories from news items
	const allCategories = useMemo(() => {
		const categories = new Set<NewsCategory>();
		news.forEach((item) => categories.add(item.category));
		return Array.from(categories).sort();
	}, [news]);

	const filteredNews = useMemo(() => {
		return news.filter((item) => {
			// Type filter
			if (typeFilter !== "all" && item.type !== typeFilter) {
				return false;
			}

			// Category filter
			if (categoryFilter !== "all" && item.category !== categoryFilter) {
				return false;
			}

			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const searchableText = [
					item.title,
					item.description,
					item.source,
					item.company,
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
	}, [news, typeFilter, categoryFilter, searchQuery]);

	// Format date for display
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Get icon/emoji based on news type
	const getTypeIcon = (item: AggregatedNewsItem) => {
		switch (item.type) {
			case "blog":
				return <span className="text-lg">📝</span>;
			case "curated":
				return <span className="text-lg">🔗</span>;
			case "announcement":
				if (item.companyLogo) {
					return (
						<Image
							src={item.companyLogo}
							alt={item.company || "Company"}
							width={24}
							height={24}
							className="rounded"
						/>
					);
				}
				return <span className="text-lg">📢</span>;
			default:
				return null;
		}
	};

	// Check if link is external (not blog post)
	const isExternalLink = (item: AggregatedNewsItem) => {
		return item.type !== "blog";
	};

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="space-y-4">
				{/* Row 1: Type and Category filters */}
				<div className="flex flex-col sm:flex-row gap-3">
					{/* Type Filter */}
					<div className="flex items-center gap-2">
						<label
							htmlFor="type-filter"
							className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
						>
							Type:
						</label>
						<CustomSelect
							id="type-filter"
							value={typeFilter}
							onChange={(value) => setTypeFilter(value as NewsType)}
							options={Object.entries(typeLabels).map(([value, label]) => ({
								value,
								label,
							}))}
							className="flex-1 sm:flex-none sm:min-w-[160px]"
						/>
					</div>

					{/* Category Filter */}
					<div className="flex items-center gap-2">
						<label
							htmlFor="category-filter"
							className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
						>
							Category:
						</label>
						<CustomSelect
							id="category-filter"
							value={categoryFilter}
							onChange={(value) => setCategoryFilter(value as "all" | NewsCategory)}
							options={[
								{ value: "all", label: "All Categories" },
								...allCategories.map((category) => ({
									value: category,
									label: categoryLabels[category],
								})),
							]}
							className="flex-1 sm:flex-none sm:min-w-[160px]"
						/>
					</div>
				</div>

				{/* Row 2: Search */}
				<div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
					<div className="flex-1 relative">
						<input
							type="text"
							placeholder="Search news..."
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
								<svg
									className="w-4 h-4"
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
						)}
					</div>
					{/* Results count */}
					<span className="text-sm text-neutral-500 text-center sm:text-left">
						{filteredNews.length} {filteredNews.length === 1 ? "item" : "items"}
					</span>
				</div>
			</div>

			{/* News Grid */}
			<div className="space-y-4">
				{filteredNews.length === 0 ? (
					<p className="text-center py-8 text-neutral-500">
						No news found matching your criteria.
					</p>
				) : (
					filteredNews.map((item) => (
						<a
							key={item.id}
							href={item.url}
							target={isExternalLink(item) ? "_blank" : undefined}
							rel={isExternalLink(item) ? "noopener noreferrer" : undefined}
							className="group block p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all"
						>
							<div className="flex items-start gap-3">
								{/* Icon */}
								<div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
									{getTypeIcon(item)}
								</div>

								{/* Content */}
								<div className="flex-1 min-w-0">
									{/* Title */}
									<h3 className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex items-center gap-2">
										<span className="truncate">{item.title}</span>
										{isExternalLink(item) && (
											<svg
												className="w-4 h-4 flex-shrink-0 text-neutral-400"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
												<polyline points="15 3 21 3 21 9" />
												<line x1="10" y1="14" x2="21" y2="3" />
											</svg>
										)}
									</h3>

									{/* Description */}
									{item.description && (
										<p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
											{item.description}
										</p>
									)}

									{/* Meta info */}
									<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
										<span>{formatDate(item.date)}</span>
										{item.source && <span>{item.source}</span>}
										{item.company && <span>{item.company}</span>}
										{item.readingTime && <span>{item.readingTime}</span>}
										<span
											className={`px-2 py-0.5 rounded-full ${
												item.category === "crypto"
													? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
													: item.category === "ai"
														? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
														: item.category === "defi"
															? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
															: item.category === "infrastructure"
																? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
																: item.category === "research"
																	? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
																	: item.category === "product"
																		? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
																		: item.category === "funding"
																			? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
																			: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
											}`}
										>
											{categoryLabels[item.category]}
										</span>
									</div>
								</div>
							</div>
						</a>
					))
				)}
			</div>
		</div>
	);
}
