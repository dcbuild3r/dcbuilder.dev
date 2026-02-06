export const NEWSLETTER_TYPES = ["news", "jobs", "candidates"] as const;
export type NewsletterType = (typeof NEWSLETTER_TYPES)[number];

export function dedupeNewsletterTypes(types: string[]): NewsletterType[] {
  const valid = new Set<NewsletterType>();
  for (const type of types) {
    if (NEWSLETTER_TYPES.includes(type as NewsletterType)) {
      valid.add(type as NewsletterType);
    }
  }
  return Array.from(valid);
}

export function computeViewTotals(current: number, previous: number) {
  return {
    totalViews: current,
    deltaViews: current - previous,
  };
}
