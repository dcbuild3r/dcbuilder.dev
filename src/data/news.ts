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
export const curatedLinks: CuratedLink[] = [
  {
    id: "vitalik-d-acc",
    type: "curated",
    title: "My techno-optimism",
    url: "https://vitalik.eth.limo/general/2023/11/27/techno_optimism.html",
    source: "Vitalik Buterin",
    date: "2023-11-27",
    description: "Vitalik's thoughts on technology, d/acc, and the future.",
    category: "crypto",
    featured: true,
  },
  {
    id: "paradigm-frontiers",
    type: "curated",
    title: "Frontiers in Mechanism Design",
    url: "https://www.paradigm.xyz/2024/01/frontiers",
    source: "Paradigm",
    date: "2024-01-15",
    description: "Research on mechanism design in crypto protocols.",
    category: "research",
  },
  {
    id: "a16z-crypto-2024",
    type: "curated",
    title: "State of Crypto 2024",
    url: "https://a16zcrypto.com/posts/article/state-of-crypto-report-2024/",
    source: "a16z crypto",
    date: "2024-10-16",
    description: "Annual report on the state of the crypto industry.",
    category: "crypto",
  },
];

// Portfolio company announcements
export const announcements: Announcement[] = [
  {
    id: "monad-devnet",
    type: "announcement",
    title: "Monad Devnet Launch",
    url: "https://x.com/monad_xyz",
    company: "Monad",
    companyLogo: "/images/investments/monad.jpg",
    platform: "x",
    date: "2024-06-01",
    description:
      "Monad launches developer network with unprecedented performance.",
    category: "product",
    featured: true,
  },
  {
    id: "berachain-mainnet",
    type: "announcement",
    title: "Berachain Mainnet Announcement",
    url: "https://x.com/beaboringbera",
    company: "Berachain",
    companyLogo: "/images/investments/berachain.png",
    platform: "x",
    date: "2024-12-01",
    description: "Berachain announces mainnet launch timeline.",
    category: "product",
  },
  {
    id: "aligned-series-a",
    type: "announcement",
    title: "Aligned Layer Raises $20M Series A",
    url: "https://x.com/alignedlayer",
    company: "Aligned",
    companyLogo: "/images/investments/aligned.png",
    platform: "x",
    date: "2024-07-15",
    description: "Aligned Layer raises Series A to build ZK verification layer.",
    category: "funding",
  },
];
