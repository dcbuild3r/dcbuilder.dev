import { type RecommendationItem, getRecommendedLinks } from "@/lib/recommendations";

const RECOMMENDATION_PRIORITY = [
  "The MEV Letter",
  "SemiAnalysis",
  "TBPN",
  "Ethereal News",
] as const;

export function getNewsToolsRecommendationSummary(limit: number = 4): {
  highlights: RecommendationItem[];
  hiddenCount: number;
} {
  const links = getRecommendedLinks();
  const prioritized = RECOMMENDATION_PRIORITY.flatMap((name) => {
    const match = links.find((link) => link.name === name);
    return match ? [match] : [];
  });
  const remaining = links.filter(
    (link) => !RECOMMENDATION_PRIORITY.includes(link.name as (typeof RECOMMENDATION_PRIORITY)[number]),
  );
  const ordered = [...prioritized, ...remaining];
  const highlights = ordered.slice(0, limit);

  return {
    highlights,
    hiddenCount: Math.max(0, ordered.length - highlights.length),
  };
}
