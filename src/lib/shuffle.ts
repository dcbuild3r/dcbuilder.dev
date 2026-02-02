/**
 * Shared utility functions for deterministic shuffling and date checks.
 * Used across CandidatesGrid, JobsGrid, and PortfolioGrid for consistent behavior.
 */

/**
 * Generate a hash from a string value for seeding random number generators.
 */
export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Create a seeded random number generator for deterministic shuffling.
 * Uses a linear congruential generator algorithm.
 */
export function seededRandom(seed: number): () => number {
  let current = seed;
  return () => {
    current = (current * 9301 + 49297) % 233280;
    return current / 233280;
  };
}

/**
 * Fisher-Yates shuffle with deterministic RNG.
 * Produces the same shuffle order given the same random function.
 */
export function shuffleArray<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Check if a date is within a specified number of days from now.
 * Useful for "NEW" badges on recently created items.
 */
export function isWithinDays(
  date: string | Date | null | undefined,
  days: number
): boolean {
  if (!date) return false;
  const d = new Date(date);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return d > cutoff;
}

/**
 * Check if item was created within the last 2 weeks (14 days).
 * Convenience wrapper for the common "NEW" badge check.
 */
export function isNew(createdAt: string | Date | null | undefined): boolean {
  return isWithinDays(createdAt, 14);
}
