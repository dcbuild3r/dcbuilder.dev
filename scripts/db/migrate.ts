import { spawnSync } from "node:child_process";

type TargetEnv = "dev" | "staging" | "prod";

const VALID_ENVS: TargetEnv[] = ["dev", "staging", "prod"];

function parseEnvArg(argv: string[]): TargetEnv {
  const arg = argv.find((value) => value.startsWith("--env="));
  if (!arg) {
    throw new Error("Missing required argument --env=dev|staging|prod");
  }

  const value = arg.slice("--env=".length).toLowerCase();
  if (!VALID_ENVS.includes(value as TargetEnv)) {
    throw new Error(`Invalid --env value \"${value}\". Expected dev, staging, or prod.`);
  }

  return value as TargetEnv;
}

function resolveUrl(targetEnv: TargetEnv): string {
  if (targetEnv === "dev") {
    const devUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
    if (!devUrl) {
      throw new Error("DATABASE_URL_DEV (or DATABASE_URL fallback) is required for --env=dev.");
    }
    return devUrl;
  }

  if (targetEnv === "staging") {
    const stagingUrl = process.env.DATABASE_URL_STAGING;
    if (!stagingUrl) {
      throw new Error("DATABASE_URL_STAGING is required for --env=staging.");
    }
    return stagingUrl;
  }

  const prodUrl = process.env.DATABASE_URL_PROD;
  if (!prodUrl) {
    throw new Error("DATABASE_URL_PROD is required for --env=prod.");
  }

  return prodUrl;
}

function run() {
  const targetEnv = parseEnvArg(process.argv.slice(2));

  if (targetEnv === "prod" && process.env.ALLOW_PROD_MIGRATION !== "true") {
    throw new Error("Refusing prod migration. Set ALLOW_PROD_MIGRATION=true to continue.");
  }

  const databaseUrl = resolveUrl(targetEnv);
  console.log(`[db:migrate] Applying migrations to ${targetEnv}`);

  const child = spawnSync("bunx", ["drizzle-kit", "migrate", "--config", "drizzle.config.ts"], {
    stdio: "inherit",
    env: {
      ...process.env,
      DRIZZLE_ENV: targetEnv,
      DATABASE_URL: databaseUrl,
    },
  });

  if (child.status !== 0) {
    process.exit(child.status ?? 1);
  }
}

try {
  run();
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown migration error";
  console.error(`[db:migrate] ${message}`);
  process.exit(1);
}
