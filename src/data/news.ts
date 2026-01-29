export type NewsSource = "curated" | "blog" | "announcement";

export type NewsCategory =
  | "crypto"
  | "ai"
  | "infrastructure"
  | "defi"
  | "research"
  | "product"
  | "funding"
  | "general"
  | "x_post";

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
  ai: "AI",
  infrastructure: "Infrastructure",
  defi: "DeFi",
  research: "Research",
  product: "Product",
  funding: "Funding",
  general: "General",
  x_post: "X Post",
};

// Curated links - external articles and X posts worth reading
export const curatedLinks: CuratedLink[] = [
  {
    id: "lighter-xyz-post",
    type: "curated",
    title: "Lighter update",
    url: "https://x.com/Lighter_xyz/status/2016633073916354820",
    source: "Lighter",
    date: "2026-01-28",
    category: "x_post",
  },
  {
    id: "dcbuilder-post",
    type: "curated",
    title: "dcbuilder thoughts",
    url: "https://x.com/dcbuilder/status/2016556940084580665",
    source: "dcbuilder",
    date: "2026-01-28",
    category: "x_post",
  },
  {
    id: "megaeth-post",
    type: "curated",
    title: "MegaETH update",
    url: "https://x.com/megaeth/status/2016511667644064164",
    source: "MegaETH",
    date: "2026-01-28",
    category: "x_post",
  },
  {
    id: "avi-schiffmann-post",
    type: "curated",
    title: "Avi Schiffmann on AI",
    url: "https://x.com/AviSchiffmann/status/2016263441640489341",
    source: "Avi Schiffmann",
    date: "2026-01-27",
    category: "x_post",
  },
  {
    id: "prime-intellect-post",
    type: "curated",
    title: "Prime Intellect announcement",
    url: "https://x.com/PrimeIntellect/status/2016280792037785624",
    source: "Prime Intellect",
    date: "2026-01-27",
    category: "x_post",
  },
  {
    id: "eito-miyamura-post",
    type: "curated",
    title: "Eito Miyamura insights",
    url: "https://x.com/Eito_Miyamura/status/2016251788765385073",
    source: "Eito Miyamura",
    date: "2026-01-27",
    category: "x_post",
  },
  {
    id: "tiagosada-post",
    type: "curated",
    title: "Tiago Sada thoughts",
    url: "https://x.com/tiagosada/status/2015861748230980033",
    source: "Tiago Sada",
    date: "2026-01-26",
    category: "x_post",
  },
  {
    id: "succinct-post",
    type: "curated",
    title: "Succinct Labs announcement",
    url: "https://x.com/SuccinctJT/status/1997030431498121250",
    source: "Succinct Labs",
    date: "2025-12-15",
    category: "x_post",
  },
];

// Portfolio company announcements
export const announcements: Announcement[] = [];
