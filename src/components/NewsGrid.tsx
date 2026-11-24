"use client";

import { useState, useMemo, useDeferredValue, useCallback, useEffect, useRef } from "react";
import type { AggregatedNewsItem } from "@/lib/news";
import type { NewsCategory } from "@/data/news";
import { CardList } from "@/components/ui/Card";
import { trackNewsClick } from "@/lib/posthog";
import { useNewsClicks } from "@/hooks/useNewsClicks";
import { normalizeCompanyFilterValue } from "@/lib/company-news";
import {
	buildNewsSearchIndex,
	filterNews,
	sortNews,
	type NewsSortMode,
	type NewsType,
} from "@/lib/news-filtering";
import { NewsFilterCard } from "./news/NewsFilterCard";
import { NewsRow } from "./news/NewsRow";

export { getNewsDisplayCompany, getNewsDisplaySource } from "@/lib/news-filtering";

const INITIAL_RENDERED_NEWS_COUNT = 30;
const NEWS_RENDER_BATCH_SIZE = 30;

interface NewsGridProps {
	news: AggregatedNewsItem[];
	companyFilter?: string;
	companyClearHref?: string;
}

export function NewsGrid({
	news,
	companyFilter: initialCompanyFilter = "",
	companyClearHref = "/news/company",
}: NewsGridProps) {
	const [typeFilter, setTypeFilter] = useState<NewsType>("all");
	const [categoryFilter, setCategoryFilter] = useState<"all" | NewsCategory>("all");
	const [sortMode, setSortMode] = useState<NewsSortMode>("posted");
	const [minimumRelevance, setMinimumRelevance] = useState(0);
	const [searchQuery, setSearchQuery] = useState("");
	const [hidePortfolioUpdates, setHidePortfolioUpdates] = useState(false);
	const companyFilter = initialCompanyFilter.trim();
	const [expandedDescriptionIds, setExpandedDescriptionIds] = useState<Set<string>>(() => new Set());
	const [failedImageKeys, setFailedImageKeys] = useState<Record<string, true>>({});
	const [newsRenderWindow, setNewsRenderWindow] = useState({
		key: "",
		count: INITIAL_RENDERED_NEWS_COUNT,
	});
	const loadMoreRef = useRef<HTMLDivElement | null>(null);
	const { getClickCount, isPopular, loaded: clicksLoaded } = useNewsClicks();
	const deferredSearchQuery = useDeferredValue(searchQuery);
	const companyFilterKey = useMemo(() => normalizeCompanyFilterValue(companyFilter), [companyFilter]);
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

	const allCategories = useMemo(
		() => Array.from(new Set(news.map((item) => item.category))).sort(),
		[news],
	);
	const newsSearchIndex = useMemo(() => buildNewsSearchIndex(news), [news]);

	const filteredNews = useMemo(
		() =>
			filterNews(
				news,
				{
					typeFilter,
					categoryFilter,
					minimumRelevance,
					hidePortfolioUpdates,
					searchQuery: deferredSearchQuery,
					companyFilter,
				},
				newsSearchIndex,
			),
		[news, typeFilter, hidePortfolioUpdates, categoryFilter, minimumRelevance, deferredSearchQuery, newsSearchIndex, companyFilter],
	);

	const sortedNews = useMemo(() => sortNews(filteredNews, sortMode), [filteredNews, sortMode]);

	const renderWindowKey = useMemo(
		() => JSON.stringify([typeFilter, hidePortfolioUpdates, categoryFilter, minimumRelevance, deferredSearchQuery, sortMode, companyFilterKey]),
		[typeFilter, hidePortfolioUpdates, categoryFilter, minimumRelevance, deferredSearchQuery, sortMode, companyFilterKey],
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
			{ rootMargin: "1200px 0px", threshold: 0 },
		);

		observer.observe(loadMoreElement);

		return () => observer.disconnect();
	}, [hasMoreNews, renderNextNewsBatch]);

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

	const handleNewsClick = useCallback((item: AggregatedNewsItem) => {
		trackNewsClick({
			news_id: item.id,
			news_title: item.title,
			news_type: item.type,
			category: item.category,
			source: item.source,
			company: item.company,
			is_featured: item.featured,
		});
	}, []);

	return (
		<div>
			<NewsFilterCard
				typeFilter={typeFilter}
				onTypeChange={setTypeFilter}
				categoryFilter={categoryFilter}
				onCategoryChange={setCategoryFilter}
				categories={allCategories}
				sortMode={sortMode}
				onSortChange={setSortMode}
				minimumRelevance={minimumRelevance}
				onRelevanceChange={setMinimumRelevance}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				hidePortfolioUpdates={hidePortfolioUpdates}
				onHidePortfolioChange={setHidePortfolioUpdates}
				itemCount={filteredNews.length}
				companyFilter={companyFilter}
				companyClearHref={companyClearHref}
			/>

			<div className="mt-3">
				{filteredNews.length === 0 ? (
					<p className="py-8 text-center text-muted">No news found matching your criteria.</p>
				) : (
					<CardList>
						{renderedNews.map((item) => (
							<NewsRow
								key={item.id}
								item={item}
								dateLabel={dateFormatter.format(new Date(item.date))}
								isDescriptionExpanded={expandedDescriptionIds.has(item.id)}
								onToggleDescription={toggleDescription}
								onOpen={handleNewsClick}
								failedImageKeys={failedImageKeys}
								markImageFailed={markImageFailed}
								clicksLoaded={clicksLoaded}
								clickCount={getClickCount(item.id)}
								isPopular={isPopular(item.id)}
							/>
						))}
					</CardList>
				)}
				{hasMoreNews && (
					<div ref={loadMoreRef} className="flex justify-center py-3">
						<button
							type="button"
							onClick={renderNextNewsBatch}
							className="min-h-11 rounded-full border border-line-strong bg-surface px-5 text-sm font-medium text-accent hover:bg-surface-2"
						>
							Load more news
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
