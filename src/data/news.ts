export type NewsSource = "curated" | "blog" | "announcement";

export type NewsCategory =
  | "crypto"
  | "ai"
  | "infrastructure"
  | "defi"
  | "research"
  | "product"
  | "funding"
  | "general";

export interface CuratedLink {
  id: string;
  type: "curated";
  title: string;
  url: string;
  source: string;
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

export type NewsItem = CuratedLink | Announcement | {
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
  ai: "AI",
  infrastructure: "Infrastructure",
  defi: "DeFi",
  research: "Research",
  product: "Product",
  funding: "Funding",
  general: "General",
};

// Curated links - external articles worth reading
export const curatedLinks: CuratedLink[] = [];

// Portfolio company announcements
export const announcements: Announcement[] = [];
