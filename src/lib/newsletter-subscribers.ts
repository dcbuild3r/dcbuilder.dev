export type NewsletterType = "news" | "jobs" | "candidates";

export type PreferenceFlags = Record<NewsletterType, boolean>;

export type NewsletterSubscriberPreference = {
  newsletterType: string;
  enabled: boolean;
};

export type NewsletterSubscriberApiRow = {
  id: string;
  email: string;
  status: string;
  createdAt: string;
  clicks7d: number;
  lastClickedLink: string | null;
  preferences: NewsletterSubscriberPreference[];
};

export type NewsletterSubscriberRowDraft = {
  id: string;
  email: string;
  status: string;
  current: PreferenceFlags;
  draft: PreferenceFlags;
  clicks7d: number;
  lastClickedLink: string | null;
  createdAt: string;
  saving: boolean;
  error: string | null;
};

export const NEWSLETTER_TYPES: NewsletterType[] = ["news", "jobs", "candidates"];

export function toPreferenceFlags(preferences: NewsletterSubscriberPreference[]): PreferenceFlags {
  const enabledTypes = new Set(
    preferences.filter((preference) => preference.enabled).map((preference) => preference.newsletterType)
  );

  return {
    news: enabledTypes.has("news"),
    jobs: enabledTypes.has("jobs"),
    candidates: enabledTypes.has("candidates"),
  };
}

export function buildNewsletterTypes(flags: PreferenceFlags): NewsletterType[] {
  return NEWSLETTER_TYPES.filter((newsletterType) => flags[newsletterType]);
}

export function isPreferenceRowDirty(current: PreferenceFlags, draft: PreferenceFlags) {
  return NEWSLETTER_TYPES.some((newsletterType) => current[newsletterType] !== draft[newsletterType]);
}

export function toSubscriberDraftRow(subscriber: NewsletterSubscriberApiRow): NewsletterSubscriberRowDraft {
  const current = toPreferenceFlags(subscriber.preferences);

  return {
    id: subscriber.id,
    email: subscriber.email,
    status: subscriber.status,
    current,
    draft: { ...current },
    clicks7d: subscriber.clicks7d,
    lastClickedLink: subscriber.lastClickedLink,
    createdAt: subscriber.createdAt,
    saving: false,
    error: null,
  };
}
