export function normalizeJobTags(tags: readonly unknown[] | null | undefined): string[] {
  if (!tags) {
    return [];
  }

  const seen = new Set<string>();
  const normalizedTags: string[] = [];

  for (const tag of tags) {
    if (typeof tag !== "string") {
      continue;
    }

    const normalized = tag.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    normalizedTags.push(normalized);
  }

  return normalizedTags;
}

export function formatJobTagLabel(tag: string): string {
  return tag
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getJobTagLabel(tag: string, labels: Record<string, string>): string {
  const normalized = tag.trim().toLowerCase();
  return labels[normalized]?.trim() || formatJobTagLabel(normalized);
}
