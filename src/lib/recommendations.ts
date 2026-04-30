export type RecommendationItem = {
  name: string;
  url: string;
  description: string;
};

const COMMON_RECOMMENDED_LINKS: RecommendationItem[] = [
  {
    name: "TBPN",
    url: "https://tbpn.substack.com",
    description: "Technology Business Programming Network — daily live business & tech podcast by @johncoogan & @jordihays",
  },
  {
    name: "SemiAnalysis",
    url: "https://semianalysis.com",
    description: "Deep dives on semiconductors, AI infrastructure, and compute",
  },
  {
    name: "Ethereal News",
    url: "https://etherealnews.substack.com",
    description: "Ethereum ecosystem news and analysis",
  },
  {
    name: "ZK Mesh",
    url: "https://zkmesh.substack.com",
    description: "Monthly zero-knowledge newsletter (zkmesh+ for premium)",
  },
  {
    name: "The MEV Letter",
    url: "https://collective.flashbots.net/tag/the-mev-letter",
    description: "Flashbots' MEV research roundup covering papers, posts, and ecosystem updates",
  },
  {
    name: "dcbuilder.dev/blog",
    url: "/blog",
    description: "Long-form thoughts and writeups",
  },
  {
    name: "@dcbuilder on X",
    url: "https://x.com/dcbuilder",
    description: "More curated content on X",
  },
];

const NEWSLETTER_EXTRA_RECOMMENDED_LINKS: RecommendationItem[] = [
  {
    name: "dcbuilder.dev/news",
    url: "https://dcbuilder.dev/news",
    description: "Older curated links and announcements",
  },
];

export const OTHER_CONTENT_I_LIKE: RecommendationItem[] = [
  {
    name: "Zero Knowledge FM",
    url: "https://zeroknowledge.fm",
    description: "Podcast on ZK proofs and the decentralized web",
  },
  {
    name: "Hardcore History",
    url: "https://www.dancarlin.com/hardcore-history-series",
    description: "Dan Carlin's epic deep-dives into history",
  },
];

export function getRecommendedLinks(options?: { includeNewsletterExtras?: boolean }): RecommendationItem[] {
  if (options?.includeNewsletterExtras) {
    return [...COMMON_RECOMMENDED_LINKS, ...NEWSLETTER_EXTRA_RECOMMENDED_LINKS];
  }

  return COMMON_RECOMMENDED_LINKS;
}
