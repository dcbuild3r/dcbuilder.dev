import type { Job, RelationshipCategory } from "@/data/jobs";
import { normalizeJobTags } from "@/lib/job-tags";
import { hashString, seededRandom, shuffleArray } from "@/lib/shuffle";

export type FilterCategory = "all" | RelationshipCategory;

export interface JobFilters {
  category: FilterCategory;
  companies: string[]; // ["all"] means no company filter
  role: string;
  location: string;
  tags: string[];
  featuredOnly: boolean;
  query: string;
}

// Company tiers matching portfolio rankings (lower = higher priority)
const companyTiers: Record<string, number> = {
  // Tier 1 - Top portfolio companies + World
  Morpho: 1,
  "Prime Intellect": 1,
  Lucis: 1,
  MegaETH: 1,
  Monad: 1,
  "Monad Foundation": 1,
  World: 1,
  // Tier 2 - Strong portfolio companies
  Succinct: 2,
  Sorella: 2,
  Agora: 2,
  Rhinestone: 2,
  Bagel: 2,
  // Tier 3 - Portfolio companies
  Ritual: 3,
  Berachain: 3,
  Inco: 3,
  // Tier 4 - Network/Friends
  Flashbots: 4,
  "Ethereum Foundation": 4,
  Aztec: 4,
  TACEO: 4,
  Nethermind: 4,
  Nascent: 4,
  CoinFund: 4,
  "Blockchain Capital": 4,
  RockawayX: 4,
  "Ackee Blockchain": 4,
  Reilabs: 4,
  "Let's Go DevOps": 4,
  Wonderland: 4,
  Merge: 4,
  // Tier 5 - Broader ecosystem
  "Uniswap Labs": 5,
  Alchemy: 5,
  // Tier 6 - Ecosystem (Monad ecosystem projects)
  Perpl: 6,
  Kuru: 6,
  RareBetSports: 6,
  // Tier 6 - Ecosystem (Berachain ecosystem projects)
  "Infrared Finance": 6,
  "Ooga Booga": 6,
  "bera.buzz": 6,
  "Kodiak Finance": 6,
  Goldsky: 6,
};

export const getTier = (job: Job) =>
  companyTiers[job.company.name] ?? (job.company.category === "portfolio" ? 4 : 5);

const LOCATION_SPLIT = /[\/(),]| or /i;

/** Unique roles/departments: prefer definitions that exist in jobs, else extract from jobs. */
export function getAllRoles(
  jobs: Job[],
  roleDefinitions: { slug: string; label: string }[],
): string[] {
  if (roleDefinitions.length > 0) {
    const jobDepartments = new Set(jobs.map((j) => j.department).filter(Boolean));
    return roleDefinitions
      .filter((r) => jobDepartments.has(r.label) || jobDepartments.has(r.slug))
      .map((r) => r.label)
      .sort();
  }
  const roles = new Set<string>();
  jobs.forEach((job) => {
    if (job.department) roles.add(job.department);
  });
  return Array.from(roles).sort();
}

/**
 * Unique locations (split on "/", " or ", ",", "(", ")" for multi-location jobs),
 * keeping "Remote (...)" as one entry because the parens carry timezone info.
 */
export function getAllLocations(jobs: Job[]): string[] {
  const locations = new Set<string>();
  jobs.forEach((job) => {
    if (job.remote) locations.add("Remote");
    if (!job.location) return;
    if (job.location.toLowerCase().startsWith("remote")) {
      const trimmed = job.location.trim();
      if (trimmed.toLowerCase() !== "remote") locations.add(trimmed);
    } else {
      job.location.split(LOCATION_SPLIT).forEach((part) => {
        const trimmed = part.trim();
        if (trimmed && trimmed.toLowerCase() !== "remote") locations.add(trimmed);
      });
    }
  });
  return Array.from(locations).sort();
}

export function buildSearchIndex(
  jobs: Job[],
  getTagLabel: (tag: string) => string,
): Map<string, string> {
  const index = new Map<string, string>();
  jobs.forEach((job) => {
    const tagText = normalizeJobTags(job.tags).map(getTagLabel).join(" ");
    index.set(
      job.id,
      [job.title, job.company.name, job.location, job.department, tagText]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    );
  });
  return index;
}

export function filterJobs(
  jobs: Job[],
  f: JobFilters,
  searchIndex: Map<string, string>,
): Job[] {
  return jobs.filter((job) => {
    if (f.category !== "all" && job.company.category !== f.category) return false;
    if (!f.companies.includes("all") && !f.companies.includes(job.company.name)) return false;
    if (f.role !== "all" && job.department !== f.role) return false;

    if (f.location !== "all") {
      if (f.location === "Remote") {
        if (!job.remote) return false;
      } else if (f.location.toLowerCase().startsWith("remote")) {
        if (job.location !== f.location) return false;
      } else {
        const jobLocations = job.location
          .split(LOCATION_SPLIT)
          .map((p) => p.trim())
          .filter(Boolean);
        if (!jobLocations.some((loc) => loc === f.location)) return false;
      }
    }

    if (f.featuredOnly && !job.featured) return false;

    // Job must have ALL selected tags
    if (f.tags.length > 0) {
      if (!job.tags || !f.tags.every((tag) => normalizeJobTags(job.tags).includes(tag))) {
        return false;
      }
    }

    if (f.query) {
      if (!(searchIndex.get(job.id) || "").includes(f.query.toLowerCase())) return false;
    }
    return true;
  });
}

/** Hot first, then featured, then the rest grouped by company tier; each group seeded-shuffled. */
export function rankJobs(
  filtered: Job[],
  filterKey: string,
  isHot: (job: Job) => boolean,
): Job[] {
  const hot = filtered.filter((j) => isHot(j));
  const featured = filtered.filter((j) => j.featured && !isHot(j));
  const nonFeatured = filtered.filter((j) => !j.featured && !isHot(j));

  const shuffledHot = shuffleArray(hot, seededRandom(hashString(`${filterKey}|hot`)));
  const shuffledFeatured = shuffleArray(
    featured,
    seededRandom(hashString(`${filterKey}|featured`)),
  );

  const tierGroups: Record<number, Job[]> = {};
  nonFeatured.forEach((job) => {
    const tier = getTier(job);
    if (!tierGroups[tier]) tierGroups[tier] = [];
    tierGroups[tier].push(job);
  });

  const shuffledNonFeatured = Object.keys(tierGroups)
    .map(Number)
    .sort((a, b) => a - b)
    .flatMap((tier) =>
      shuffleArray(tierGroups[tier], seededRandom(hashString(`${filterKey}|tier-${tier}`))),
    );

  return [...shuffledHot, ...shuffledFeatured, ...shuffledNonFeatured];
}
