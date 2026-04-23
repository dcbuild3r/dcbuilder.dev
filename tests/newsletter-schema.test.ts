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

  test("matches wrapped missing-column errors for known newsletter campaign fields", () => {
    const cause = new Error('column "timeframe_preset" does not exist') as Error & {
      code?: string;
    };
    cause.code = "42703";

    const error = new Error("Failed query") as Error & { cause?: Error };
    error.cause = cause;

    expect(isMissingNewsletterSchemaError(error)).toBe(true);
  });

  test("does not treat permission errors as missing schema", () => {
    expect(
      isMissingNewsletterSchemaError(new Error("permission denied for relation newsletter_campaigns"))
    ).toBe(false);
  });
});
