export const NEWSLETTER_DB_UNAVAILABLE_ERROR =
  "Newsletter database is temporarily unavailable. Run the newsletter migrations and try again.";

export type NewsletterAvailabilityMeta = {
  newsletterUnavailable: true;
  reason: string;
};

function collectErrorMessages(error: unknown, depth: number = 0): string[] {
  if (!error || depth > 3) return [];

  if (typeof error === "string") return [error];

  if (error instanceof Error) {
    const messages = [error.message];
    const cause = "cause" in error ? (error as Error & { cause?: unknown }).cause : undefined;
    return [...messages, ...collectErrorMessages(cause, depth + 1)];
  }

  if (typeof error === "object") {
    const values = Object.values(error as Record<string, unknown>);
    return values.flatMap((value) => collectErrorMessages(value, depth + 1));
  }

  return [];
}

export function isMissingNewsletterSchemaError(error: unknown): boolean {
  const haystack = collectErrorMessages(error)
    .join("\n")
    .toLowerCase();

  const mentionsNewsletter =
    haystack.includes("newsletter_") || haystack.includes("newsletter ");
  const mentionsMissingSchema =
    haystack.includes("relation") && haystack.includes("does not exist") ||
    haystack.includes("undefined column") ||
    haystack.includes("unknown column") ||
    haystack.includes("no such table");

  return mentionsNewsletter && mentionsMissingSchema;
}

export function getNewsletterAvailabilityMeta(): NewsletterAvailabilityMeta {
  return {
    newsletterUnavailable: true,
    reason: NEWSLETTER_DB_UNAVAILABLE_ERROR,
  };
}
