import { afterEach, describe, expect, test } from "bun:test";
import { assertNotProd } from "../src/lib/prod-db-guard";

const PROD_URL =
  "postgresql://postgres.rzjbyplttszgdyfiaghb:password@aws-1-eu-west-2.pooler.supabase.com:5432/postgres";
const STAGING_URL =
  "postgresql://postgres.tjlxqxtpbwvtlqulahlx:password@aws-1-eu-west-2.pooler.supabase.com:5432/postgres";

describe("assertNotProd", () => {
  afterEach(() => {
    delete process.env.ALLOW_PROD_SEED;
  });

  test("throws for the production Supabase project", () => {
    expect(() => assertNotProd(PROD_URL)).toThrow("production Supabase database");
  });

  test("passes for the staging Supabase project", () => {
    expect(assertNotProd(STAGING_URL).isStaging).toBe(true);
  });

  test("passes for localhost", () => {
    expect(assertNotProd("postgres://postgres:postgres@127.0.0.1:5432/dcbuilder_test").host).toBe(
      "127.0.0.1:5432"
    );
  });

  test("bypasses prod only with the explicit override value", () => {
    process.env.ALLOW_PROD_SEED = "i-know-what-im-doing";
    expect(assertNotProd(PROD_URL).isProd).toBe(true);
  });

  test("throws for malformed URLs", () => {
    expect(() => assertNotProd("not a postgres url")).toThrow("Malformed database URL");
  });
});
