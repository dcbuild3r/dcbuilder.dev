import type { Investment, SortOption } from "@/types/investments";
import { hashString, seededRandom, shuffleArray } from "@/lib/shuffle";

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

  // Relevance: featured first (shuffled within tier groups), then non-featured, followed by exited and defunct
  const featured = active.filter((i) => i.featured);
  const nonFeatured = active.filter((i) => !i.featured);

  // Group featured by tier and shuffle each group
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

  return [...shuffledFeatured, ...shuffledNonFeatured, ...shuffledExited, ...shuffledDefunct];
}
