/**
 * News type definitions and labels
 * Data is fetched from the database - see src/db/schema/news.ts
 */

export type NewsSource = "curated" | "blog" | "announcement";

export type NewsCategory =
	| "crypto"
	| "ethereum"
	| "cryptography"
	| "ai"
	| "health"
	| "infrastructure"
	| "defi"
	| "research"
	| "product"
	| "cool_product"
	| "developer_tooling"
	| "funding"
	| "world"
	| "general"
	| "x_post";

export interface CuratedLink {
	id: string;
	type: "curated";
	title: string;
	url: string;
	source: string;
	sourceImage?: string;
	date: string;
	description?: string;
	category: NewsCategory;
	featured?: boolean;
}

export interface Announcement {
	id: string;
	type: "announcement";
	title: string;
	url: string;
	company: string;
	companyLogo?: string;
	platform: "x" | "blog" | "discord" | "github" | "other";
	date: string;
	description?: string;
	category: NewsCategory;
	featured?: boolean;
}

export type NewsItem =
	| CuratedLink
	| Announcement
	| {
			id: string;
			type: "blog";
			title: string;
			url: string;
			date: string;
			description?: string;
			category: NewsCategory;
			readingTime?: string;
	  };

export const categoryLabels: Record<NewsCategory, string> = {
	crypto: "Crypto",
	ethereum: "Ethereum",
	cryptography: "Cryptography",
	ai: "AI",
	health: "Health",
	infrastructure: "Infrastructure",
	defi: "DeFi",
	research: "Research",
	product: "Product",
	cool_product: "Cool Product",
	developer_tooling: "Developer Tooling",
	funding: "Funding",
	world: "World",
	general: "General",
	x_post: "X Post",
};
