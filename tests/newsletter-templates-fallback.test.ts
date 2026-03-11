import { afterEach, describe, expect, mock, test } from "bun:test";

describe("newsletter template fallbacks", () => {
  afterEach(() => {
    mock.restore();
  });

  test("uses default templates when the newsletter templates table is missing", async () => {
    const actualDb = await import("../src/db");

    mock.module("@/db", () => ({
      ...actualDb,
      db: {
        select: () => ({
          from: () => {
            throw new Error('relation "newsletter_templates" does not exist');
          },
        }),
      },
    }));

    const { listNewsletterTemplates } = await import(
      `../src/services/newsletter?newsletter-templates-fallback=${Date.now()}`
    );
    const templates = await listNewsletterTemplates();

    expect(templates).toHaveLength(3);
    expect(templates.map((template) => template.newsletterType)).toEqual([
      "news",
      "jobs",
      "candidates",
    ]);
    expect(templates.every((template) => template.markdownTemplate.length > 0)).toBe(true);
  });
});
