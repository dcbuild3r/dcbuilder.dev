"use client";

import { useState, useMemo, useDeferredValue, useCallback } from "react";
import Image from "next/image";
import { AggregatedNewsItem } from "@/lib/news";
import { NewsCategory, categoryLabels } from "@/data/news";
import { CustomSelect } from "./CustomSelect";
import { trackNewsClick } from "@/lib/posthog";
import { useNewsClicks } from "@/hooks/useNewsClicks";

type NewsType = "all" | "blog" | "curated" | "announcement";

const typeLabels: Record<NewsType, string> = {
	all: "All",
	blog: "Blog Posts",
	curated: "Curated Links",
	announcement: "Announcements",
};

const NEWS_THUMBNAIL_SIZE = 56;
const NEWS_THUMBNAIL_REQUEST_SIZE = "112px";
const NEWS_THUMBNAIL_QUALITY = 90;
const BLOG_IMAGE_CACHE_VERSION = "20260206";

// Check if item is fresh based on platform
// X posts: 5 days, everything else: 2 weeks
const isFreshItem = (dateString: string | Date | undefined, platform?: string): boolean => {
	if (!dateString) return false;
	const date = new Date(dateString);
	const now = new Date();
	const cutoff = new Date();

	// X posts are fresh for 5 days, others for 2 weeks
	const daysThreshold = platform === "x" ? 5 : 14;
	cutoff.setDate(now.getDate() - daysThreshold);

	return date > cutoff;
};

interface NewsGridProps {
	news: AggregatedNewsItem[];
}

export function NewsGrid({ news }: NewsGridProps) {
	const [typeFilter, setTypeFilter] = useState<NewsType>("all");
	const [categoryFilter, setCategoryFilter] = useState<"all" | NewsCategory>("all");
	const [minimumRelevance, setMinimumRelevance] = useState(0);
	const [searchQuery, setSearchQuery] = useState("");
	const [failedImageKeys, setFailedImageKeys] = useState<Record<string, true>>({});
	const { getClickCount, isPopular, loaded: clicksLoaded } = useNewsClicks();
	const deferredSearchQuery = useDeferredValue(searchQuery);
	const dateFormatter = useMemo(
		() =>
			new Intl.DateTimeFormat("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
				timeZone: "UTC",
			}),
		[],
	);

	// Get all unique categories from news items
	const allCategories = useMemo(() => {
		const categories = new Set<NewsCategory>();
		news.forEach((item) => categories.add(item.category));
		return Array.from(categories).sort();
	}, [news]);

	const newsSearchIndex = useMemo(() => {
		const index = new Map<string, string>();
		news.forEach((item) => {
			index.set(
				item.id,
				[item.title, item.description, item.source, item.company]
					.filter(Boolean)
					.join(" ")
					.toLowerCase(),
			);
		});
		return index;
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

			if (minimumRelevance > 0 && (item.relevance ?? 5) < minimumRelevance) {
				return false;
			}

			if (deferredSearchQuery) {
				const query = deferredSearchQuery.toLowerCase();
				const searchableText = newsSearchIndex.get(item.id) || "";
				if (!searchableText.includes(query)) {
					return false;
				}
			}

			return true;
		});
		}, [news, typeFilter, categoryFilter, minimumRelevance, deferredSearchQuery, newsSearchIndex]);

	// Format date for display
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return dateFormatter.format(date);
	};

	const renderCommaSeparatedTokens = (value: string | undefined, keyPrefix: string) => {
		if (!value?.trim()) return null;
		const tokens = value
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);

		return tokens.flatMap((token, idx) => {
			const parts: React.ReactNode[] = [];
			if (idx > 0) parts.push(<span key={`${keyPrefix}:sep:${idx}`}> - </span>);
			parts.push(<span key={`${keyPrefix}:${idx}`}>{token}</span>);
			return parts;
		});
	};

	// Extract X/Twitter handle from URL
	const getXHandle = (url: string): string | null => {
		const match = url.match(/x\.com\/([^/]+)/);
		return match ? match[1] : null;
	};

	const markImageFailed = useCallback((key: string) => {
		setFailedImageKeys((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
	}, []);

	const getBlogImageUrl = useCallback((rawUrl: string) => {
		const url = rawUrl.trim();
		if (!url.includes(".r2.dev/blog/images/")) {
			return url;
		}
		const separator = url.includes("?") ? "&" : "?";
		return `${url}${separator}v=${BLOG_IMAGE_CACHE_VERSION}`;
	}, []);

	// X logo SVG for overlay
	const XLogo = () => (
		<div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900">
			<svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
				<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
			</svg>
		</div>
	);

	// Get icon/image based on news type
	const getTypeIcon = (item: AggregatedNewsItem) => {
		// Check if it's an X post (url contains x.com)
		if (item.url.includes("x.com/")) {
			const imageKey = `${item.id}:x`;
			const sourceImage = item.sourceImage?.trim();
			if (sourceImage && !failedImageKeys[imageKey]) {
				return (
					<div className="relative group-hover:scale-[1.08] transition-transform duration-150">
						<Image
							src={sourceImage}
							alt={item.source || "X source"}
							width={NEWS_THUMBNAIL_SIZE}
							height={NEWS_THUMBNAIL_SIZE}
							sizes={NEWS_THUMBNAIL_REQUEST_SIZE}
							quality={NEWS_THUMBNAIL_QUALITY}
							className="rounded-full w-14 h-14 object-cover"
							onError={() => markImageFailed(imageKey)}
						/>
						<XLogo />
					</div>
				);
			}

			const handle = getXHandle(item.url);
			if (handle && !failedImageKeys[imageKey]) {
				return (
					<div className="relative group-hover:scale-[1.08] transition-transform duration-150">
						<Image
							src={`https://unavatar.io/twitter/${handle}`}
							alt={handle}
							width={NEWS_THUMBNAIL_SIZE}
							height={NEWS_THUMBNAIL_SIZE}
							sizes={NEWS_THUMBNAIL_REQUEST_SIZE}
							quality={NEWS_THUMBNAIL_QUALITY}
							className="rounded-full w-14 h-14 object-cover"
							onError={() => markImageFailed(imageKey)}
						/>
						<XLogo />
					</div>
				);
			}
			return <span className="text-5xl group-hover:scale-[1.08] transition-transform duration-150 inline-block">𝕏</span>;
		}

		switch (item.type) {
			case "blog":
				if (item.image?.trim()) {
					const imageKey = `${item.id}:blog`;
					if (failedImageKeys[imageKey]) {
						return <span className="text-5xl group-hover:scale-[1.08] transition-transform duration-150 inline-block">📝</span>;
					}
					return (
						<Image
							src={getBlogImageUrl(item.image)}
							alt={item.title}
							width={NEWS_THUMBNAIL_SIZE}
							height={NEWS_THUMBNAIL_SIZE}
							sizes={NEWS_THUMBNAIL_REQUEST_SIZE}
							quality={NEWS_THUMBNAIL_QUALITY}
							className="rounded object-cover w-14 h-14 group-hover:scale-[1.08] transition-transform duration-150"
							onError={() => markImageFailed(imageKey)}
						/>
					);
				}
				return <span className="text-5xl group-hover:scale-[1.08] transition-transform duration-150 inline-block">📝</span>;
			case "curated":
				if (item.sourceImage?.trim()) {
					const imageKey = `${item.id}:curated`;
					if (failedImageKeys[imageKey]) {
						return <span className="text-5xl group-hover:scale-[1.08] transition-transform duration-150 inline-block">🔗</span>;
					}
					return (
						<Image
							src={item.sourceImage.trim()}
							alt={item.source || item.title}
							width={NEWS_THUMBNAIL_SIZE}
							height={NEWS_THUMBNAIL_SIZE}
							sizes={NEWS_THUMBNAIL_REQUEST_SIZE}
							quality={NEWS_THUMBNAIL_QUALITY}
							className="rounded-full w-14 h-14 object-cover group-hover:scale-[1.08] transition-transform duration-150"
							onError={() => markImageFailed(imageKey)}
						/>
					);
				}
				return <span className="text-5xl group-hover:scale-[1.08] transition-transform duration-150 inline-block">🔗</span>;
			case "announcement":
				if (item.companyLogo?.trim()) {
					const imageKey = `${item.id}:announcement`;
					if (failedImageKeys[imageKey]) {
						return <span className="text-5xl group-hover:scale-[1.08] transition-transform duration-150 inline-block">📢</span>;
					}
					return (
						<Image
							src={item.companyLogo.trim()}
							alt={item.company || "Company"}
							width={NEWS_THUMBNAIL_SIZE}
							height={NEWS_THUMBNAIL_SIZE}
							sizes={NEWS_THUMBNAIL_REQUEST_SIZE}
							quality={NEWS_THUMBNAIL_QUALITY}
							unoptimized
							className="rounded w-14 h-14 object-cover group-hover:scale-[1.08] transition-transform duration-150"
							onError={() => markImageFailed(imageKey)}
						/>
					);
				}
				return <span className="text-5xl group-hover:scale-[1.08] transition-transform duration-150 inline-block">📢</span>;
			default:
				return null;
		}
	};

	// Check if link is external (not blog post)
	const isExternalLink = (item: AggregatedNewsItem) => {
		return item.type !== "blog";
	};

	// Track news click
	const handleNewsClick = (item: AggregatedNewsItem) => {
		trackNewsClick({
			news_id: item.id,
			news_title: item.title,
			news_type: item.type,
			category: item.category,
			source: item.source,
			company: item.company,
			is_featured: item.featured,
		});
	};

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="space-y-4">
				{/* Row 1: Type, Category, and Relevance filters */}
				<div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
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

					{/* Relevance Filter */}
					<div className="flex items-center gap-2 sm:ml-1">
						<label
							htmlFor="relevance-filter"
							className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
						>
							Relevance:
						</label>
						<div className="flex min-h-9 flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 dark:border-neutral-700 dark:bg-neutral-900 sm:flex-none">
							<input
								id="relevance-filter"
								type="range"
								min={0}
								max={10}
								step={1}
								value={minimumRelevance}
								onChange={(event) => setMinimumRelevance(Number(event.target.value))}
								aria-valuetext={minimumRelevance === 0 ? "All" : `${minimumRelevance} and up`}
								className="w-full accent-neutral-900 dark:accent-neutral-100 sm:w-24"
							/>
							<span className="min-w-9 rounded-full bg-neutral-100 px-2 py-0.5 text-center text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
								{minimumRelevance === 0 ? "All" : `${minimumRelevance}+`}
							</span>
						</div>
					</div>
				</div>

				{/* Row 2: Search */}
				<div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
					<div className="flex-1 relative">
						<input
							type="text"
							aria-label="Search news"
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
							onClick={() => handleNewsClick(item)}
							className="group block p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
						>
							<div className="flex items-center gap-4">
								{/* Icon */}
								<div className="flex-shrink-0 w-14 h-14 flex items-center justify-center">
									{getTypeIcon(item)}
								</div>

								{/* Content */}
								<div className="flex-1 min-w-0">
									{/* Title */}
									<h3 className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex items-center gap-2">
										<span className="truncate">{item.title}</span>
										{isFreshItem(item.date, item.platform) && (
											<span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">
												✨ FRESH
											</span>
										)}
										{clicksLoaded && isPopular(item.id) && (
											<span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
												🔥 POPULAR
											</span>
										)}
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
										{clicksLoaded && getClickCount(item.id) > 0 && (
											<span>{getClickCount(item.id)} clicks</span>
										)}
										{renderCommaSeparatedTokens(item.source, `${item.id}:source`)}
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
