type NewsletterSlugDateAnchorInput = {
  sentAt?: Date | null;
  scheduledAt?: Date | null;
  createdAt?: Date | null;
};

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function formatUtcDate(value: Date) {
  return [
    value.getUTCFullYear(),
    padDatePart(value.getUTCMonth() + 1),
    padDatePart(value.getUTCDate()),
  ].join("-");
}

function normalizeNewsletterSlugSubject(subject: string) {
  const normalized = subject
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "newsletter";
}

export function deriveNewsletterSlugDateAnchor(input: NewsletterSlugDateAnchorInput) {
  return input.sentAt ?? input.scheduledAt ?? input.createdAt ?? new Date();
}

export function buildNewsletterPublicSlug(subject: string, publishDate: Date) {
  return `${normalizeNewsletterSlugSubject(subject)}-${formatUtcDate(publishDate)}`;
}

export function ensureUniqueNewsletterPublicSlug(
  baseSlug: string,
  existingSlugs: string[],
) {
  const existing = new Set(existingSlugs);
  if (!existing.has(baseSlug)) {
    return baseSlug;
  }

  let highestSuffix = 1;
  const suffixPattern = new RegExp(`^${baseSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-([0-9]+)$`);

  for (const slug of existingSlugs) {
    const match = slug.match(suffixPattern);
    if (!match) {
      continue;
    }

    const suffix = Number.parseInt(match[1], 10);
    if (!Number.isNaN(suffix) && suffix > highestSuffix) {
      highestSuffix = suffix;
    }
  }

  return `${baseSlug}-${highestSuffix + 1}`;
}
