import { describe, expect, test } from "bun:test";
import { isMissingNewsletterSchemaError } from "../src/services/newsletter-schema";

describe("isMissingNewsletterSchemaError", () => {
  test("matches missing newsletter table and column errors", () => {
    expect(
      isMissingNewsletterSchemaError(new Error('relation "newsletter_campaigns" does not exist'))
    ).toBe(true);
    expect(
      isMissingNewsletterSchemaError(new Error('column "archive_subject" of relation "newsletter_campaigns" does not exist'))
    ).toBe(true);
  });

  test("does not treat permission errors as missing schema", () => {
    expect(
      isMissingNewsletterSchemaError(new Error("permission denied for relation newsletter_campaigns"))
    ).toBe(false);
  });
});
