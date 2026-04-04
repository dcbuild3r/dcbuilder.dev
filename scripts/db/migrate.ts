import { drizzle } from "drizzle-orm/postgres-js";
import { sql as drizzleSql } from "drizzle-orm";
import { readMigrationFiles, type MigrationConfig } from "drizzle-orm/migrator";
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

function quoteSqlIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, "\"\"")}"`;
}

function quoteSqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function isSchemaPermissionError(error: unknown): boolean {
  const code = (
    error as
      | { code?: string; cause?: { code?: string } }
      | undefined
  )?.cause?.code ?? (error as { code?: string } | undefined)?.code;
  const message = error instanceof Error ? error.message : String(error);

  return code === "42501" || /permission denied/i.test(message);
}

async function schemaExists(db: ReturnType<typeof drizzle>, schema: string): Promise<boolean> {
  const rows = await db.execute(
    drizzleSql.raw(
      `select schema_name from information_schema.schemata where schema_name = ${quoteSqlLiteral(schema)} limit 1`
    )
  ) as Array<{ schema_name?: string }>;

  return rows.length > 0;
}

async function ensureMigrationSchema(
  db: ReturnType<typeof drizzle>,
  schema: string
) {
  if (await schemaExists(db, schema)) {
    return;
  }

  try {
    await db.execute(
      drizzleSql.raw(`CREATE SCHEMA IF NOT EXISTS ${quoteSqlIdentifier(schema)}`)
    );
  } catch (error) {
    if (isSchemaPermissionError(error) && await schemaExists(db, schema)) {
      return;
    }
    throw error;
  }
}

async function migrateWithSchemaFallback(
  db: ReturnType<typeof drizzle>,
  config: MigrationConfig
) {
  const migrations = readMigrationFiles(config);
  const migrationsTable = config.migrationsTable ?? "__drizzle_migrations";
  const migrationsSchema = config.migrationsSchema ?? "drizzle";
  const qualifiedTable = `${quoteSqlIdentifier(migrationsSchema)}.${quoteSqlIdentifier(migrationsTable)}`;

  await ensureMigrationSchema(db, migrationsSchema);
  await db.execute(
    drizzleSql.raw(
      `CREATE TABLE IF NOT EXISTS ${qualifiedTable} (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )`
    )
  );

  const dbMigrations = await db.execute(
    drizzleSql.raw(
      `select id, hash, created_at from ${qualifiedTable} order by created_at desc limit 1`
    )
  ) as Array<{ created_at: string }>;
  const lastDbMigration = dbMigrations[0];

  await db.transaction(async (tx) => {
    for await (const migration of migrations) {
      if (!lastDbMigration || Number(lastDbMigration.created_at) < migration.folderMillis) {
        for (const stmt of migration.sql) {
          await tx.execute(drizzleSql.raw(stmt));
        }

        await tx.execute(
          drizzleSql.raw(
            `insert into ${qualifiedTable} ("hash", "created_at") values(${quoteSqlLiteral(migration.hash)}, ${migration.folderMillis})`
          )
        );
      }
    }
  });
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

  const queryClient = postgres(databaseUrl, {
    max: 1,
    socket: targetEnv === "dev"
      ? undefined
      : () => createPreferredPostgresSocket(databaseUrl),
  });

  try {
    const db = drizzle(queryClient);
    await migrateWithSchemaFallback(db, { migrationsFolder: "drizzle" });
  } finally {
    await queryClient.end({ timeout: 5 });
  }
}

run().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown migration error";
  console.error(`[db:migrate] ${message}`);
  process.exit(1);
});
