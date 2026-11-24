import type { AggregatedNewsItem } from "@/lib/news";
import type { NewsCategory } from "@/data/news";
import {
	compareNewsByDateAndRelevance,
	compareNewsByPostedAtAndRelevance,
} from "@/lib/news-sorting";
import { newsItemMatchesCompany, normalizeCompanyFilterValue } from "@/lib/company-news";

export type NewsType = "all" | "portfolio" | "blog" | "curated" | "announcement";
export type NewsSortMode = "posted" | "content";

export const DCBUILDER_X_HANDLE = "dcbuilder";

export const typeLabels: Record<NewsType, string> = {
	all: "All",
	portfolio: "Portfolio",
	blog: "Blog posts",
	curated: "Curated links",
	announcement: "Announcements",
};

export const sortModeLabels: Record<NewsSortMode, string> = {
	posted: "Date DC posted",
	content: "Date content posted",
};

export interface NewsFilterOptions {
	typeFilter: NewsType;
	categoryFilter: "all" | NewsCategory;
	minimumRelevance: number;
	hidePortfolioUpdates: boolean;
	searchQuery: string;
	companyFilter: string;
}

export function isPortfolioUpdateItem(item: AggregatedNewsItem): boolean {
	const normalizedCompany = (item.company ?? "").trim().replace(/\s+/g, " ").toLowerCase();
	return Boolean(item.portfolioCompany) || (
		item.type === "announcement" &&
		normalizedCompany.length > 0 &&
		normalizedCompany !== DCBUILDER_X_HANDLE
	);
}

function normalizeDisplayName(value: string | null | undefined): string {
	return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getNewsDisplaySource(
	item: Pick<AggregatedNewsItem, "source" | "portfolioCompany">,
): string | undefined {
	const source = item.source?.trim();
	const companyTitle = item.portfolioCompany?.title?.trim();
	if (!source || !companyTitle) return source;

	const normalizedCompanyTitle = normalizeDisplayName(companyTitle);
	const companySuffix = new RegExp(`\\s*\\(${escapeRegExp(companyTitle)}\\)`, "i");
	const displaySource = source
		.split(",")
		.map((token) => token.replace(companySuffix, "").trim())
		.filter((token) => normalizeDisplayName(token) !== normalizedCompanyTitle)
		.filter(Boolean)
		.join(", ");

	return displaySource || undefined;
}

export function getNewsDisplayCompany(
	item: Pick<AggregatedNewsItem, "company" | "portfolioCompany">,
): string | undefined {
	const company = item.company?.trim();
	const companyTitle = item.portfolioCompany?.title?.trim();
	if (!company) return undefined;

	return companyTitle && normalizeDisplayName(company) === normalizeDisplayName(companyTitle)
		? undefined
		: company;
}

/** X posts are fresh for 5 days, everything else for 2 weeks. */
export function isFreshItem(
	dateString: string | Date | undefined,
	platform?: string,
	now: Date = new Date(),
): boolean {
	if (!dateString) return false;
	const cutoff = new Date(now);
	cutoff.setDate(now.getDate() - (platform === "x" ? 5 : 14));
	return new Date(dateString) > cutoff;
}

export function buildNewsSearchIndex(news: AggregatedNewsItem[]): Map<string, string> {
	const index = new Map<string, string>();
	for (const item of news) {
		index.set(
			item.id,
			[item.title, item.description, item.source, item.company, item.portfolioCompany?.title]
				.filter(Boolean)
				.join(" ")
				.toLowerCase(),
		);
	}
	return index;
}

export function filterNews(
	news: AggregatedNewsItem[],
	options: NewsFilterOptions,
	searchIndex: Map<string, string>,
): AggregatedNewsItem[] {
	const { typeFilter, categoryFilter, minimumRelevance, hidePortfolioUpdates, searchQuery, companyFilter } = options;
	const hasCompanyFilter = Boolean(normalizeCompanyFilterValue(companyFilter));
	const query = searchQuery.toLowerCase();

	return news.filter((item) => {
		if (hasCompanyFilter && !newsItemMatchesCompany(item, companyFilter)) return false;

		if (typeFilter === "portfolio") {
			if (!isPortfolioUpdateItem(item)) return false;
		} else if (hidePortfolioUpdates && isPortfolioUpdateItem(item)) {
			return false;
		} else if (typeFilter === "announcement") {
			if (item.type !== "announcement" || item.company?.toLowerCase() !== DCBUILDER_X_HANDLE) return false;
		} else if (typeFilter !== "all" && item.type !== typeFilter) {
			return false;
		}

		if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
		if (minimumRelevance > 0 && (item.relevance ?? 5) < minimumRelevance) return false;
		if (query && !(searchIndex.get(item.id) || "").includes(query)) return false;

		return true;
	});
}

export function sortNews(news: AggregatedNewsItem[], sortMode: NewsSortMode): AggregatedNewsItem[] {
	const comparator =
		sortMode === "posted" ? compareNewsByPostedAtAndRelevance : compareNewsByDateAndRelevance;
	return [...news].sort(comparator);
}
