import { execSync } from "node:child_process";

function parseArg(name: string): string | undefined {
  const withEquals = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (withEquals) return withEquals.slice(name.length + 1);

  const idx = process.argv.indexOf(name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];

  return undefined;
}

function getChangedFiles(base: string, head: string): string[] {
  const output = execSync(`git diff --name-only ${base}...${head}`, { encoding: "utf8" });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function run() {
  const base = parseArg("--base") || "origin/master";
  const head = parseArg("--head") || "HEAD";

  const changedFiles = getChangedFiles(base, head);
  const schemaChanged = changedFiles.some((file) => file.startsWith("src/db/schema/"));
  const sqlMigrationChanged = changedFiles.some(
    (file) => file.startsWith("drizzle/") && file.endsWith(".sql")
  );

  if (schemaChanged && !sqlMigrationChanged) {
    console.error("[db:check:migrations] Schema files changed without SQL migration files.");
    console.error("[db:check:migrations] Add and commit a drizzle/*.sql migration before merging.");
    process.exit(1);
  }

  console.log("[db:check:migrations] OK");
}

try {
  run();
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown schema/migration sync error";
  console.error(`[db:check:migrations] ${message}`);
  process.exit(1);
}
