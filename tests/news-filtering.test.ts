import { describe, expect, test } from "bun:test";
import type { AggregatedNewsItem } from "../src/lib/news";
import {
	buildNewsSearchIndex,
	filterNews,
	isFreshItem,
	isPortfolioUpdateItem,
	sortNews,
	type NewsFilterOptions,
} from "../src/lib/news-filtering";

function item(overrides: Partial<AggregatedNewsItem> & { id: string }): AggregatedNewsItem {
	return {
		type: "curated",
		title: overrides.id,
		url: `https://example.com/${overrides.id}`,
		date: "2026-04-20",
		postedAt: "2026-04-20T00:00:00.000Z",
		category: "ai",
		relevance: 5,
		...overrides,
	};
}

const base: NewsFilterOptions = {
	typeFilter: "all",
	categoryFilter: "all",
	minimumRelevance: 0,
	hidePortfolioUpdates: false,
	searchQuery: "",
	companyFilter: "",
};

const news = [
	item({ id: "curated-ai", title: "Frontier model" }),
	item({ id: "blog-post", type: "blog", category: "crypto", relevance: 9 }),
	item({ id: "own-announce", type: "announcement", company: "dcbuilder" }),
	item({ id: "co-announce", type: "announcement", company: "Morpho", category: "defi" }),
];
const index = buildNewsSearchIndex(news);
const ids = (options: Partial<NewsFilterOptions>) =>
	filterNews(news, { ...base, ...options }, index).map((n) => n.id);

describe("news filtering", () => {
	test("detects portfolio updates from company announcements", () => {
		expect(isPortfolioUpdateItem(news[3])).toBe(true);
		expect(isPortfolioUpdateItem(news[2])).toBe(false);
	});

	test("type filter: announcement means dcbuilder's own, portfolio means company updates", () => {
		expect(ids({ typeFilter: "announcement" })).toEqual(["own-announce"]);
		expect(ids({ typeFilter: "portfolio" })).toEqual(["co-announce"]);
		expect(ids({ typeFilter: "blog" })).toEqual(["blog-post"]);
	});

	test("hide portfolio updates, category, relevance and search combine", () => {
		expect(ids({ hidePortfolioUpdates: true })).not.toContain("co-announce");
		expect(ids({ categoryFilter: "crypto" })).toEqual(["blog-post"]);
		expect(ids({ minimumRelevance: 8 })).toEqual(["blog-post"]);
		expect(ids({ searchQuery: "frontier" })).toEqual(["curated-ai"]);
	});

	test("fresh window is 5 days for X and 14 days otherwise", () => {
		const now = new Date("2026-04-30T00:00:00Z");
		expect(isFreshItem("2026-04-22", "x", now)).toBe(false);
		expect(isFreshItem("2026-04-22", undefined, now)).toBe(true);
	});

	test("sortNews does not mutate and orders by posted time", () => {
		const input = [
			item({ id: "a", postedAt: "2026-04-01T00:00:00.000Z" }),
			item({ id: "b", postedAt: "2026-04-02T00:00:00.000Z" }),
		];
		expect(sortNews(input, "posted").map((n) => n.id)).toEqual(["b", "a"]);
		expect(input[0].id).toBe("a");
	});
});
