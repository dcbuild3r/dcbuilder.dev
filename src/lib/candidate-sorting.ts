import type { Candidate } from "@/data/candidates";
import { hashString, seededRandom, shuffleArray } from "@/lib/shuffle";

type CandidatePredicate = (candidate: Candidate) => boolean;

interface SortCandidatesOptions {
  filterKey: string;
  isHotCandidate: CandidatePredicate;
  hasTopTag: CandidatePredicate;
}

const PRIORITY_GROUPS = [
  "featured-hot",
  "featured",
  "hot",
  "top",
  "verified",
  "unverified",
] as const;

type CandidatePriorityGroup = (typeof PRIORITY_GROUPS)[number];

function getCandidatePriorityGroup(
  candidate: Candidate,
  isHotCandidate: CandidatePredicate,
  hasTopTag: CandidatePredicate
): CandidatePriorityGroup {
  const isHot = isHotCandidate(candidate);

  if (candidate.featured && isHot) return "featured-hot";
  if (candidate.featured) return "featured";
  if (isHot) return "hot";
  if (hasTopTag(candidate)) return "top";
  if (candidate.vouched === true) return "verified";
  return "unverified";
}

function shuffleAndSortByTier(
  candidates: Candidate[],
  filterKey: string,
  seedPrefix: string
): Candidate[] {
  const tierGroups: Record<number, Candidate[]> = {};

  candidates.forEach((candidate) => {
    const tier = candidate.tier;
    if (!tierGroups[tier]) tierGroups[tier] = [];
    tierGroups[tier].push(candidate);
  });

  return Object.keys(tierGroups)
    .map(Number)
    .sort((a, b) => a - b)
    .flatMap((tier) =>
      shuffleArray(
        tierGroups[tier],
        seededRandom(hashString(`${filterKey}|${seedPrefix}|tier-${tier}`))
      )
    );
}

export function sortCandidatesByVisibilityPriority(
  candidates: Candidate[],
  { filterKey, isHotCandidate, hasTopTag }: SortCandidatesOptions
): Candidate[] {
  const candidatesByPriority: Record<CandidatePriorityGroup, Candidate[]> = {
    "featured-hot": [],
    featured: [],
    hot: [],
    top: [],
    verified: [],
    unverified: [],
  };

  candidates.forEach((candidate) => {
    candidatesByPriority[
      getCandidatePriorityGroup(candidate, isHotCandidate, hasTopTag)
    ].push(candidate);
  });

  return PRIORITY_GROUPS.flatMap((group) =>
    shuffleAndSortByTier(candidatesByPriority[group], filterKey, group)
  );
}
