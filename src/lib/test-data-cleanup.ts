export const TEST_ID_PREFIX = "test-";

const TEST_PREFIXES = ["test ", "demo ", "qa ", "e2e "];
const TEST_MARKERS = [
  TEST_ID_PREFIX,
  "demo-",
  "qa-",
  "e2e-",
  "@test.example.com",
  "@example.com",
  ".example.com",
  "://example.com",
];

export function isTestLikeValue(value: string | null | undefined) {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;

  return (
    TEST_PREFIXES.some((prefix) => normalized.startsWith(prefix)) ||
    TEST_MARKERS.some((marker) => normalized.includes(marker))
  );
}

type TestDataEnvironment = Partial<
  Record<"CI" | "DATABASE_URL_PROD" | "NODE_ENV" | "TEST_MODE" | "VERCEL_ENV", string>
>;

const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function parseDatabaseUrl(databaseUrl: string) {
  try {
    return new URL(databaseUrl);
  } catch {
    throw new Error("Test data writes require a valid PostgreSQL DATABASE_URL.");
  }
}

function normalizeDatabaseUrl(databaseUrl: string | undefined) {
  if (!databaseUrl) return null;
  return parseDatabaseUrl(databaseUrl).toString();
}

function isLocalDatabaseHost(hostname: string) {
  return LOCAL_DATABASE_HOSTS.has(hostname.toLowerCase());
}

export function describeDatabaseTarget(databaseUrl: string) {
  const parsed = parseDatabaseUrl(databaseUrl);
  const port = parsed.port || "5432";
  const database = parsed.pathname.replace(/^\//, "") || "<unknown>";

  return `${parsed.hostname}:${port}/${database}`;
}

export function assertSafeTestDataTarget(
  databaseUrl: string | undefined,
  operation: string,
  env: TestDataEnvironment = process.env
): asserts databaseUrl is string {
  if (!databaseUrl) {
    throw new Error(`${operation} requires DATABASE_URL.`);
  }

  const parsed = parseDatabaseUrl(databaseUrl);
  const target = describeDatabaseTarget(databaseUrl);
  const isExplicitTestRun = env.TEST_MODE === "true" || env.CI === "true";

  if (!isExplicitTestRun) {
    throw new Error(
      `${operation} refused to write test data to ${target}. Set TEST_MODE=true for local test databases.`
    );
  }

  if (env.NODE_ENV === "production" || env.VERCEL_ENV === "production") {
    throw new Error(`${operation} refused to write test data while production environment flags are set.`);
  }

  if (normalizeDatabaseUrl(databaseUrl) === normalizeDatabaseUrl(env.DATABASE_URL_PROD)) {
    throw new Error(`${operation} refused to write test data to DATABASE_URL_PROD (${target}).`);
  }

  if (!isLocalDatabaseHost(parsed.hostname)) {
    throw new Error(`${operation} refused to write test data to non-local database ${target}.`);
  }
}
