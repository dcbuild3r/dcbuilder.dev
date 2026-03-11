import { defineConfig } from "drizzle-kit";

type DrizzleEnv = "dev" | "staging" | "prod";

function isGenerateCommand(): boolean {
  return process.argv.some((arg) => arg === "generate");
}

function resolveDrizzleEnv(): DrizzleEnv {
  const target = (process.env.DRIZZLE_ENV || "dev").toLowerCase();
  if (target === "dev" || target === "staging" || target === "prod") {
    return target;
  }
  throw new Error(`Invalid DRIZZLE_ENV "${target}". Expected one of: dev, staging, prod.`);
}

function resolveDatabaseUrl(env: DrizzleEnv): string {
  const shouldAllowPlaceholder = isGenerateCommand();

  if (env === "dev") {
    const url = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
    if (!url) {
      if (shouldAllowPlaceholder) {
        return "postgresql://localhost:5432/drizzle_generate_placeholder";
      }
      throw new Error("Missing DATABASE_URL_DEV (or DATABASE_URL fallback) for DRIZZLE_ENV=dev.");
    }
    return url;
  }

  if (env === "staging") {
    const url = process.env.DATABASE_URL_STAGING;
    if (!url) {
      if (shouldAllowPlaceholder) {
        return "postgresql://localhost:5432/drizzle_generate_placeholder";
      }
      throw new Error("Missing DATABASE_URL_STAGING for DRIZZLE_ENV=staging.");
    }
    return url;
  }

  const url = process.env.DATABASE_URL_PROD;
  if (!url) {
    if (shouldAllowPlaceholder) {
      return "postgresql://localhost:5432/drizzle_generate_placeholder";
    }
    throw new Error("Missing DATABASE_URL_PROD for DRIZZLE_ENV=prod.");
  }
  return url;
}

const drizzleEnv = resolveDrizzleEnv();

export default defineConfig({
  schema: "./src/db/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: resolveDatabaseUrl(drizzleEnv),
  },
});
