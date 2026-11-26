import type { Investment, SortOption } from "@/types/investments";
import { hashString, seededRandom, shuffleArray } from "@/lib/shuffle";

const featuredOrder = [
  "Lighter",
  "Prime Intellect",
  "Lucis",
  "Monad",
  "Exo",
  "Morpho",
  "Friend",
  "Octet",
  "v12.sh",
  "Accountable",
  "Runner",
  "Phylax",
  "OWN",
];
const featuredRanks = new Map([
  ...featuredOrder.map((title, index) => [title, index - featuredOrder.length] as const),
  ["Praxis", 1],
]);
const nonFeaturedRanks = new Map([
  ["Ritual", -2],
  ["Sorella", -1],
  ["Berachain", 1],
]);

function compareRank(ranks: ReadonlyMap<string, number>) {
  return (a: Investment, b: Investment) =>
    (ranks.get(a.title) ?? 0) - (ranks.get(b.title) ?? 0);
}

function placeBeside(investments: Investment[], title: string, anchor: string, side: "before" | "after") {
  const index = investments.findIndex((investment) => investment.title === title);
  const anchorIndex = investments.findIndex((investment) => investment.title === anchor);
  if (index === -1 || anchorIndex === -1) return;

  const [investment] = investments.splice(index, 1);
  const insertionIndex = anchorIndex - Number(index < anchorIndex) + Number(side === "after");
  investments.splice(insertionIndex, 0, investment);
}

// Status groups take precedence over every user-selected sort.
export function sortPortfolioInvestments(
  investments: Investment[],
  sortBy: SortOption,
  seedBase: string
): Investment[] {
  const active = investments.filter(
    (i) => i.status !== "exited" && i.status !== "defunct"
  );
  const exited = investments.filter((i) => i.status === "exited");
  const defunct = investments.filter((i) => i.status === "defunct");

  if (sortBy === "alphabetical") {
    return [
      ...active.sort((a, b) => a.title.localeCompare(b.title)),
      ...exited.sort((a, b) => a.title.localeCompare(b.title)),
      ...defunct.sort((a, b) => a.title.localeCompare(b.title)),
    ];
  }
  if (sortBy === "alphabetical-desc") {
    return [
      ...active.sort((a, b) => b.title.localeCompare(a.title)),
      ...exited.sort((a, b) => b.title.localeCompare(a.title)),
      ...defunct.sort((a, b) => b.title.localeCompare(a.title)),
    ];
  }

  // Relevance: featured first, then non-featured, followed by exited and defunct.
  const featured = active.filter((i) => i.featured);
  const nonFeatured = active.filter((i) => !i.featured);

  // Shuffle featured investments of the same tier before applying the featured order.
  const featuredTierGroups: Record<number, Investment[]> = {};
  featured.forEach((inv) => {
    if (!featuredTierGroups[inv.tier]) featuredTierGroups[inv.tier] = [];
    featuredTierGroups[inv.tier].push(inv);
  });

  const shuffledFeatured = Object.keys(featuredTierGroups)
    .map(Number)
    .sort((a, b) => a - b)
    .flatMap((tier) =>
      shuffleArray(
        featuredTierGroups[tier],
        seededRandom(hashString(`${seedBase}|featured|tier-${tier}`))
      )
    );
  const relevanceFeatured = shuffledFeatured.sort(compareRank(featuredRanks));

  // Group non-featured by tier and shuffle each group
  const tierGroups: Record<number, Investment[]> = {};
  nonFeatured.forEach((inv) => {
    if (!tierGroups[inv.tier]) tierGroups[inv.tier] = [];
    tierGroups[inv.tier].push(inv);
  });

  const shuffledNonFeatured = Object.keys(tierGroups)
    .map(Number)
    .sort((a, b) => a - b)
    .flatMap((tier) =>
      shuffleArray(
        tierGroups[tier],
        seededRandom(hashString(`${seedBase}|tier-${tier}`))
      )
    );

  const shuffledExited = shuffleArray(
    exited,
    seededRandom(hashString(`${seedBase}|exited`))
  );

  const shuffledDefunct = shuffleArray(
    defunct,
    seededRandom(hashString(`${seedBase}|defunct`))
  );

  const relevanceNonFeatured = shuffledNonFeatured.sort(compareRank(nonFeaturedRanks));
  placeBeside(relevanceNonFeatured, "Agora", "Rhinestone", "after");
  placeBeside(relevanceNonFeatured, "Pragma", "Inco", "before");
  const relevanceExited = shuffledExited.sort(
    (a, b) => Number(b.title === "Mode") - Number(a.title === "Mode")
  );

  return [...relevanceFeatured, ...relevanceNonFeatured, ...relevanceExited, ...shuffledDefunct];
}
