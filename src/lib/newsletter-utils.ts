export const NEWSLETTER_TYPES = ["news", "jobs", "candidates"] as const;
export type NewsletterType = (typeof NEWSLETTER_TYPES)[number];

export const NEWSLETTER_CONTENT_MODES = ["template", "markdown", "manual"] as const;
export type NewsletterContentMode = (typeof NEWSLETTER_CONTENT_MODES)[number];

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

export function normalizeNewsletterContentMode(mode?: string): NewsletterContentMode {
  if (mode && NEWSLETTER_CONTENT_MODES.includes(mode as NewsletterContentMode)) {
    return mode as NewsletterContentMode;
  }
  return "template";
}
