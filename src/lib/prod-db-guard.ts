const PROD_PROJECT_REF = "rzjbyplttszgdyfiaghb";
const STAGING_PROJECT_REF = "tjlxqxtpbwvtlqulahlx";
const PROD_SEED_OVERRIDE = "i-know-what-im-doing";
const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

export interface DatabaseTargetInfo {
  host: string;
  projectRef: string | null;
  isProd: boolean;
  isStaging: boolean;
}

export function describeDatabaseTarget(databaseUrl: string): DatabaseTargetInfo {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error(`Malformed database URL: ${databaseUrl || "(empty)"}`);
  }

  const lowerUrl = databaseUrl.toLowerCase();
  const usernameProjectRef = decodeURIComponent(parsed.username).match(/^postgres\.([a-z0-9]+)$/i)?.[1] ?? null;
  const hostProjectRef = parsed.hostname.match(/(?:^|\.)?(rzjbyplttszgdyfiaghb|tjlxqxtpbwvtlqulahlx)(?:\.|$)/i)?.[1] ?? null;
  const projectRef = lowerUrl.includes(PROD_PROJECT_REF)
    ? PROD_PROJECT_REF
    : lowerUrl.includes(STAGING_PROJECT_REF)
      ? STAGING_PROJECT_REF
      : usernameProjectRef || hostProjectRef;

  return {
    host: parsed.host,
    projectRef,
    isProd: lowerUrl.includes(PROD_PROJECT_REF),
    isStaging: lowerUrl.includes(STAGING_PROJECT_REF),
  };
}

export function formatDatabaseTarget(databaseUrl: string): string {
  const target = describeDatabaseTarget(databaseUrl);
  return `${target.host} (${target.projectRef ? `project ${target.projectRef}` : "project unknown"})`;
}

export function assertNotProd(
  databaseUrl: string,
  opts: {
    allowEnvVar?: string;
  } = {}
): DatabaseTargetInfo {
  const target = describeDatabaseTarget(databaseUrl);
  const allowEnvVar = opts.allowEnvVar || "ALLOW_PROD_SEED";
  const overrideValue = process.env[allowEnvVar];

  if (target.isProd && overrideValue !== PROD_SEED_OVERRIDE) {
    throw new Error(
      `${RED}${BOLD}Refusing to write test/fixture data to the production Supabase database.${RESET}\n` +
        `Detected URL: ${databaseUrl}\n` +
        `Detected host: ${target.host}\n` +
        `Detected project ref: ${target.projectRef || "unknown"}\n` +
        `Set ${allowEnvVar}=${PROD_SEED_OVERRIDE} only if you intentionally want to modify prod.`
    );
  }

  return target;
}
