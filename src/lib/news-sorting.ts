export type NewsSortDirection = "asc" | "desc";

export interface NewsSortItem {
  id?: string;
  title?: string;
  date: string | Date | null | undefined;
  relevance?: number | null;
}

export interface NewsPostedSortItem extends NewsSortItem {
  postedAt?: string | Date | null | undefined;
}

function getUtcDayTimestamp(date: string | Date | null | undefined): number | null {
  if (!date) return null;

  const parsed = date instanceof Date ? date : new Date(date);
  const timestamp = parsed.getTime();

  if (Number.isNaN(timestamp)) return null;

  return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

function getExactTimestamp(date: string | Date | null | undefined): number | null {
  if (!date) return null;

  const parsed = date instanceof Date ? date : new Date(date);
  const timestamp = parsed.getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function compareNullableTimestamps(
  a: number | null,
  b: number | null,
  direction: NewsSortDirection
) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;

  return direction === "desc" ? b - a : a - b;
}

export function compareNewsByDateAndRelevance<T extends NewsSortItem>(
  a: T,
  b: T,
  direction: NewsSortDirection = "desc"
) {
  const dayComparison = compareNullableTimestamps(
    getUtcDayTimestamp(a.date),
    getUtcDayTimestamp(b.date),
    direction
  );

  if (dayComparison !== 0) return dayComparison;

  const relevanceComparison = (b.relevance ?? 0) - (a.relevance ?? 0);
  if (relevanceComparison !== 0) return relevanceComparison;

  const exactDateComparison = compareNullableTimestamps(
    getExactTimestamp(a.date),
    getExactTimestamp(b.date),
    direction
  );

  if (exactDateComparison !== 0) return exactDateComparison;

  return (a.title ?? a.id ?? "").localeCompare(b.title ?? b.id ?? "");
}

export function compareNewsByPostedAtAndRelevance<T extends NewsPostedSortItem>(
  a: T,
  b: T,
  direction: NewsSortDirection = "desc"
) {
  const postedComparison = compareNullableTimestamps(
    getExactTimestamp(a.postedAt ?? a.date),
    getExactTimestamp(b.postedAt ?? b.date),
    direction
  );

  if (postedComparison !== 0) return postedComparison;

  const relevanceComparison = (b.relevance ?? 0) - (a.relevance ?? 0);
  if (relevanceComparison !== 0) return relevanceComparison;

  return (a.title ?? a.id ?? "").localeCompare(b.title ?? b.id ?? "");
}
