import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { createPreferredPostgresSocket, resolvePreferredPostgresTarget } from "../../src/db/postgres-connection";

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

async function run() {
  const targetEnv = parseEnvArg(process.argv.slice(2));

  if (targetEnv === "prod" && process.env.ALLOW_PROD_MIGRATION !== "true") {
    throw new Error("Refusing prod migration. Set ALLOW_PROD_MIGRATION=true to continue.");
  }

  const databaseUrl = resolveUrl(targetEnv);
  console.log(`[db:migrate] Applying migrations to ${targetEnv}`);

  const target = await resolvePreferredPostgresTarget(databaseUrl);
  if (target.tlsServername && target.connectHost !== target.tlsServername) {
    console.log(
      `[db:migrate] Using IPv4 connect target ${target.connectHost} for ${target.tlsServername}`
    );
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    socket: targetEnv === "dev"
      ? undefined
      : () => createPreferredPostgresSocket(databaseUrl),
  });

  try {
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: "drizzle" });
  } finally {
    await sql.end({ timeout: 5 });
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown migration error";
  console.error(`[db:migrate] ${message}`);
  process.exit(1);
});
