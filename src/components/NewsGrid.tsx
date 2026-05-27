"use client";

import { useState, useMemo, useDeferredValue, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { AggregatedNewsItem } from "@/lib/news";
import {
	compareNewsByDateAndRelevance,
	compareNewsByPostedAtAndRelevance,
} from "@/lib/news-sorting";
import { NewsCategory, categoryLabels } from "@/data/news";
import { CustomSelect } from "./CustomSelect";
import { trackNewsClick } from "@/lib/posthog";
import { useNewsClicks } from "@/hooks/useNewsClicks";

type NewsType = "all" | "portfolio" | "blog" | "curated" | "announcement";
type NewsSortMode = "posted" | "content";

const typeLabels: Record<NewsType, string> = {
	all: "All",
	portfolio: "Portfolio",
	blog: "Blog Posts",
	curated: "Curated Links",
	announcement: "Announcements",
};

const sortModeLabels: Record<NewsSortMode, string> = {
	posted: "Date DC posted",
	content: "Date content posted",
};

const NEWS_THUMBNAIL_SIZE = 56;
const NEWS_THUMBNAIL_REQUEST_SIZE = "112px";
const NEWS_THUMBNAIL_QUALITY = 90;
const BLOG_IMAGE_CACHE_VERSION = "20260206";
const INITIAL_RENDERED_NEWS_COUNT = 30;
const NEWS_RENDER_BATCH_SIZE = 30;
const MONAD_TWITTER_LOGO_URL = "https://pbs.twimg.com/profile_images/1945153889881243648/CehOdEnT_400x400.jpg";
const MONAD_LOGO_SRC = "/logos/monad.png";
const GOOGLE_RESEARCH_LOGO_SRC = "/logos/google-research.svg";
const DARK_X_LOGO_HANDLES = new Set(["googleresearch"]);

function getNormalizedLogoSrc(src: string): string {
	return src.trim() === MONAD_TWITTER_LOGO_URL ? MONAD_LOGO_SRC : src.trim();
}

function getXAvatarClassName(handle?: string | null): string {
	const normalizedHandle = handle?.trim().toLowerCase();
	if (normalizedHandle && DARK_X_LOGO_HANDLES.has(normalizedHandle)) {
		return "h-14 w-14 rounded-full bg-white object-contain p-1.5";
	}

	return "h-14 w-14 rounded-full object-cover";
}

function getXAvatarSrc(handle: string): string {
	return handle.trim().toLowerCase() === "googleresearch"
		? GOOGLE_RESEARCH_LOGO_SRC
		: `https://unavatar.io/twitter/${handle}`;
}

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
	const [sortMode, setSortMode] = useState<NewsSortMode>("posted");
	const [minimumRelevance, setMinimumRelevance] = useState(0);
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedDescriptionIds, setExpandedDescriptionIds] = useState<Set<string>>(() => new Set());
	const [failedImageKeys, setFailedImageKeys] = useState<Record<string, true>>({});
	const [newsRenderWindow, setNewsRenderWindow] = useState({
		key: "",
		count: INITIAL_RENDERED_NEWS_COUNT,
	});
	const loadMoreRef = useRef<HTMLDivElement | null>(null);
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
			if (typeFilter === "portfolio" && !item.portfolioCompany) {
				return false;
			}

			if (typeFilter !== "all" && typeFilter !== "portfolio" && item.type !== typeFilter) {
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

	const sortedNews = useMemo(() => {
		const comparator =
			sortMode === "posted" ? compareNewsByPostedAtAndRelevance : compareNewsByDateAndRelevance;
		return [...filteredNews].sort(comparator);
	}, [filteredNews, sortMode]);

	const renderWindowKey = useMemo(
		() => JSON.stringify([typeFilter, categoryFilter, minimumRelevance, deferredSearchQuery, sortMode]),
		[typeFilter, categoryFilter, minimumRelevance, deferredSearchQuery, sortMode],
	);
	const renderedNewsCount =
		newsRenderWindow.key === renderWindowKey ? newsRenderWindow.count : INITIAL_RENDERED_NEWS_COUNT;

	const renderedNews = useMemo(
		() => sortedNews.slice(0, renderedNewsCount),
		[sortedNews, renderedNewsCount],
	);
	const hasMoreNews = renderedNewsCount < sortedNews.length;

	const renderNextNewsBatch = useCallback(() => {
		setNewsRenderWindow((current) => {
			const currentCount =
				current.key === renderWindowKey ? current.count : INITIAL_RENDERED_NEWS_COUNT;

			return {
				key: renderWindowKey,
				count: Math.min(currentCount + NEWS_RENDER_BATCH_SIZE, sortedNews.length),
			};
		});
	}, [renderWindowKey, sortedNews.length]);

	useEffect(() => {
		const loadMoreElement = loadMoreRef.current;
		if (!loadMoreElement || !hasMoreNews) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					renderNextNewsBatch();
				}
			},
			{
				rootMargin: "1200px 0px",
				threshold: 0,
			},
		);

		observer.observe(loadMoreElement);

		return () => observer.disconnect();
	}, [hasMoreNews, renderNextNewsBatch]);

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

	const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	const getSourceWithoutPortfolioCompany = (item: AggregatedNewsItem) => {
		const source = item.source?.trim();
		const company = item.portfolioCompany;
		const companyTitle = company?.title?.trim();
		if (!source || !company || !companyTitle) return source;

		if (company.sourceIsCompanyAccount && source.toLowerCase() === companyTitle.toLowerCase()) {
			return undefined;
		}

		const companySuffix = new RegExp(`\\s*\\(${escapeRegExp(companyTitle)}\\)`, "i");
		return source
			.split(",")
			.map((token) => token.replace(companySuffix, "").trim())
			.filter(Boolean)
			.join(", ");
	};

	// Extract X/Twitter handle from URL
	const getXHandle = (url: string): string | null => {
		const match = url.match(/x\.com\/([^/]+)/);
		return match ? match[1] : null;
	};

	const markImageFailed = useCallback((key: string) => {
		setFailedImageKeys((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
	}, []);

	const toggleDescription = useCallback((itemId: string) => {
		setExpandedDescriptionIds((current) => {
			const next = new Set(current);
			if (next.has(itemId)) {
				next.delete(itemId);
			} else {
				next.add(itemId);
			}
			return next;
		});
	}, []);

	const getBlogImageUrl = useCallback((rawUrl: string) => {
		const url = rawUrl.trim();
		if (!url.includes(".r2.dev/blog/images/")) {
			return url;
		}
		const separator = url.includes("?") ? "&" : "?";
		return `${url}${separator}v=${BLOG_IMAGE_CACHE_VERSION}`;
	}, []);

	const getPortfolioCompanyMetaLogo = (item: AggregatedNewsItem) => {
		const company = item.portfolioCompany;
		if (!company?.logo?.trim() || !company.sourceIsCompanyAccount) return null;

		const imageKey = `${item.id}:portfolio-company-meta`;
		if (failedImageKeys[imageKey]) return null;

		const logo = (
			<Image
				src={getNormalizedLogoSrc(company.logo)}
				alt={company.title}
				width={24}
				height={24}
				sizes="24px"
				className="h-full w-full rounded-md bg-white object-contain p-0.5"
				unoptimized
				onError={() => markImageFailed(imageKey)}
			/>
		);
		const className =
			"pointer-events-auto inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white shadow-sm transition-transform duration-150 hover:scale-110 dark:border-neutral-700";

		if (!company.website) {
			return (
				<span className={className} aria-label={company.title} title={company.title}>
					{logo}
				</span>
			);
		}

		return (
			<a
				href={company.website}
				target="_blank"
				rel="noopener noreferrer"
				onClick={(event) => event.stopPropagation()}
				className={className}
				aria-label={`Open ${company.title}`}
				title={company.title}
			>
				{logo}
			</a>
		);
	};

	const getPortfolioCompanyMetaName = (item: AggregatedNewsItem) => {
		const company = item.portfolioCompany;
		if (!company?.title?.trim()) return null;

		const className =
			"pointer-events-auto inline-flex rounded-sm font-bold text-black underline-offset-4 transition-colors hover:text-neutral-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 dark:text-white dark:hover:text-neutral-200 dark:focus-visible:ring-white/70";

		if (!company.website) {
			return (
				<span className={className} title={company.title}>
					{company.title}
				</span>
			);
		}

		return (
			<a
				href={company.website}
				target="_blank"
				rel="noopener noreferrer"
				onClick={(event) => event.stopPropagation()}
				className={className}
				aria-label={`Open ${company.title}`}
				title={company.title}
			>
				{company.title}
			</a>
		);
	};

	const getPortfolioCompanyAvatarBadge = (item: AggregatedNewsItem) => {
		const company = item.portfolioCompany;
		if (!company?.logo?.trim() || company.sourceIsCompanyAccount) return null;

		const imageKey = `${item.id}:portfolio-company-avatar`;
		if (failedImageKeys[imageKey]) return null;

		const logo = (
			<Image
				src={getNormalizedLogoSrc(company.logo)}
				alt={company.title}
				width={40}
				height={40}
				sizes="40px"
				className="h-full w-full rounded-md bg-white object-contain p-0.5"
				unoptimized
				onError={() => markImageFailed(imageKey)}
			/>
		);
		const className =
			"pointer-events-auto absolute -bottom-12 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-lg border-2 border-white bg-white shadow-sm transition-transform duration-150 hover:scale-110 dark:border-neutral-900";

		if (!company.website) {
			return (
				<span className={className} aria-label={company.title} title={company.title}>
					{logo}
				</span>
			);
		}

		return (
			<a
				href={company.website}
				target="_blank"
				rel="noopener noreferrer"
				onClick={(event) => event.stopPropagation()}
				className={className}
				aria-label={`Open ${company.title}`}
				title={company.title}
			>
				{logo}
			</a>
		);
	};

	const hasPortfolioCompanyAvatarBadge = (item: AggregatedNewsItem) => {
		const company = item.portfolioCompany;
		if (!company?.logo?.trim() || company.sourceIsCompanyAccount) return false;

		return !failedImageKeys[`${item.id}:portfolio-company-avatar`];
	};

	const getPortfolioHiringLink = (item: AggregatedNewsItem) => {
		const company = item.portfolioCompany;
		if (!company?.jobsUrl || company.jobCount <= 0) return null;

		const hasJobCount = true;

		return (
			<a
				href={company.jobsUrl}
				onClick={(event) => event.stopPropagation()}
				className="pointer-events-auto flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold leading-none text-white shadow-sm transition-[transform,box-shadow,background-color] duration-150 hover:scale-105 hover:bg-black hover:shadow-md active:scale-100 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
				aria-label={
					hasJobCount
						? `View ${company.jobCount} job openings at ${company.title}`
						: `View job openings at ${company.title}`
				}
			>
				<span className="relative flex h-2 w-2">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75 dark:bg-neutral-900"></span>
					<span className="relative inline-flex h-2 w-2 rounded-full bg-white dark:bg-neutral-900"></span>
				</span>
				<span>Hiring</span>
				{hasJobCount && (
					<span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold leading-none text-neutral-900 dark:bg-neutral-900 dark:text-white">
						{company.jobCount}
					</span>
				)}
			</a>
		);
	};

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
							className={getXAvatarClassName(getXHandle(item.url))}
							onError={() => markImageFailed(imageKey)}
						/>
						<XLogo />
						{getPortfolioCompanyAvatarBadge(item)}
					</div>
				);
			}

			const handle = getXHandle(item.url);
			if (handle && !failedImageKeys[imageKey]) {
				return (
					<div className="relative group-hover:scale-[1.08] transition-transform duration-150">
						<Image
							src={getXAvatarSrc(handle)}
							alt={handle}
							width={NEWS_THUMBNAIL_SIZE}
							height={NEWS_THUMBNAIL_SIZE}
							sizes={NEWS_THUMBNAIL_REQUEST_SIZE}
							quality={NEWS_THUMBNAIL_QUALITY}
							className={getXAvatarClassName(handle)}
							onError={() => markImageFailed(imageKey)}
						/>
						<XLogo />
						{getPortfolioCompanyAvatarBadge(item)}
					</div>
				);
			}
			return (
				<span className="relative inline-block text-5xl transition-transform duration-150 group-hover:scale-[1.08]">
					𝕏
					{getPortfolioCompanyAvatarBadge(item)}
				</span>
			);
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
						<div className="relative group-hover:scale-[1.08] transition-transform duration-150">
							<Image
								src={item.sourceImage.trim()}
								alt={item.source || item.title}
								width={NEWS_THUMBNAIL_SIZE}
								height={NEWS_THUMBNAIL_SIZE}
								sizes={NEWS_THUMBNAIL_REQUEST_SIZE}
								quality={NEWS_THUMBNAIL_QUALITY}
								className="rounded-full w-14 h-14 object-cover"
								onError={() => markImageFailed(imageKey)}
							/>
							{getPortfolioCompanyAvatarBadge(item)}
						</div>
					);
				}
				return (
					<span className="relative inline-block text-5xl transition-transform duration-150 group-hover:scale-[1.08]">
						🔗
						{getPortfolioCompanyAvatarBadge(item)}
					</span>
				);
			case "announcement":
				if (item.companyLogo?.trim()) {
					const imageKey = `${item.id}:announcement`;
					if (failedImageKeys[imageKey]) {
						return <span className="text-5xl group-hover:scale-[1.08] transition-transform duration-150 inline-block">📢</span>;
					}
					const logoSrc = getNormalizedLogoSrc(item.companyLogo);
					return (
						<Image
							src={logoSrc}
							alt={item.company || "Company"}
							width={NEWS_THUMBNAIL_SIZE}
							height={NEWS_THUMBNAIL_SIZE}
							sizes={NEWS_THUMBNAIL_REQUEST_SIZE}
							quality={NEWS_THUMBNAIL_QUALITY}
							unoptimized
							className="h-14 w-14 rounded-lg object-contain transition-transform duration-150 group-hover:scale-[1.08]"
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

					{/* Sort Mode */}
					<div className="flex items-center gap-2">
						<label
							htmlFor="sort-mode"
							className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
						>
							Order:
						</label>
						<CustomSelect
							id="sort-mode"
							value={sortMode}
							onChange={(value) => setSortMode(value as NewsSortMode)}
							options={Object.entries(sortModeLabels).map(([value, label]) => ({
								value,
								label,
							}))}
							className="flex-1 sm:flex-none sm:min-w-[180px]"
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
					renderedNews.map((item) => {
						const isDescriptionExpanded = expandedDescriptionIds.has(item.id);
						const hasAvatarBadge = hasPortfolioCompanyAvatarBadge(item);

						return (
							<div
								key={item.id}
								className="group relative block rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
							>
								<a
									href={item.url}
									target={isExternalLink(item) ? "_blank" : undefined}
									rel={isExternalLink(item) ? "noopener noreferrer" : undefined}
									onClick={() => handleNewsClick(item)}
									className="absolute inset-0 z-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600"
									aria-label={`Open ${item.title}`}
								>
									<span className="sr-only">Open {item.title}</span>
								</a>
								<div className="relative z-10 flex items-start gap-4 pointer-events-none">
									<div
										className={`flex w-14 flex-shrink-0 justify-center ${
											hasAvatarBadge ? "h-28 items-start" : "h-14 items-center"
										}`}
									>
										{getTypeIcon(item)}
									</div>

									<div className="flex-1 min-w-0">
										<h3 className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex items-center gap-2">
											<span className="truncate">{item.title}</span>
											{isFreshItem(item.date, item.platform) && (
												<span className="flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400">
													✨ FRESH
												</span>
											)}
											{getPortfolioHiringLink(item)}
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

										{item.description && (
											<p
												className={`mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-400 ${
													isDescriptionExpanded ? "" : "line-clamp-3 sm:line-clamp-2"
												}`}
											>
												{item.description}
											</p>
										)}

										{item.description && (
											<button
												type="button"
												onClick={() => toggleDescription(item.id)}
												className="pointer-events-auto mt-2 inline-flex items-center text-xs font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-950 dark:text-neutral-300 dark:decoration-neutral-700 dark:hover:text-neutral-50 sm:hidden"
												aria-expanded={isDescriptionExpanded}
											>
												{isDescriptionExpanded ? "Show less" : "Show more"}
											</button>
										)}

										<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
											<span>Published {formatDate(item.date)}</span>
											{renderCommaSeparatedTokens(getSourceWithoutPortfolioCompany(item), `${item.id}:source`)}
											{item.company && <span>{item.company}</span>}
											{getPortfolioCompanyMetaName(item)}
											{getPortfolioCompanyMetaLogo(item)}
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
											{clicksLoaded && getClickCount(item.id) > 0 && (
												<span>{getClickCount(item.id)} clicks</span>
											)}
											{item.readingTime && <span>{item.readingTime}</span>}
										</div>
									</div>
								</div>
							</div>
						);
					})
				)}
				{hasMoreNews && (
					<div ref={loadMoreRef} className="flex justify-center py-3">
						<button
							type="button"
							onClick={renderNextNewsBatch}
							className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-white"
						>
							Load more news
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
