export const NEWSLETTER_DB_UNAVAILABLE_ERROR =
  "Newsletter database is temporarily unavailable. Run the newsletter migrations and try again.";

export type NewsletterAvailabilityMeta = {
  newsletterUnavailable: true;
  reason: string;
};

const NEWSLETTER_SCHEMA_COLUMN_HINTS = [
  "content_mode",
  "markdown_content",
  "manual_html",
  "manual_text",
  "rendered_html",
  "rendered_text",
  "archive_subject",
  "archive_preview_text",
  "archive_content_mode",
  "archive_markdown_content",
  "archive_manual_html",
  "archive_manual_text",
  "archive_rendered_html",
  "archive_rendered_text",
  "archive_corrected_at",
  "archive_corrected_by",
  "timeframe_preset",
  "minimum_relevance",
] as const;

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
    haystack.includes("newsletter_") ||
    haystack.includes("newsletter ") ||
    NEWSLETTER_SCHEMA_COLUMN_HINTS.some((columnName) => haystack.includes(columnName));
  const mentionsMissingSchema =
    haystack.includes("column") && haystack.includes("does not exist") ||
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
