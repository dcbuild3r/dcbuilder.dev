import dns from "node:dns/promises";
import net from "node:net";

type LookupResult = {
  address: string;
  family: number;
};

export type LookupFn = (
  hostname: string,
  options: { family: 4; all: true }
) => Promise<LookupResult[]>;

export type PreferredPostgresTarget = {
  connectHost: string;
  port: number;
  tlsServername: string | undefined;
};

type PostgresClientOptions = {
  socket?: () => Promise<ConnectedSocket>;
};

type ConnectedSocket = net.Socket & {
  host: string;
  port: number;
};

type DatabaseEnv = Record<string, string | undefined>;

function getNonEmptyEnv(env: DatabaseEnv, name: string): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

export function resolveDatabaseUrl(env: DatabaseEnv = process.env): string {
  const primaryUrl = getNonEmptyEnv(env, "DATABASE_URL");
  if (primaryUrl) return primaryUrl;

  const vercelEnv = getNonEmptyEnv(env, "VERCEL_ENV");
  const nodeEnv = getNonEmptyEnv(env, "NODE_ENV");
  const fallbackNames =
    vercelEnv === "production" || (!vercelEnv && nodeEnv === "production")
      ? ["DATABASE_URL_PROD"]
      : vercelEnv === "preview"
        ? ["DATABASE_URL_STAGING"]
        : ["DATABASE_URL_DEV"];

  for (const name of fallbackNames) {
    const fallbackUrl = getNonEmptyEnv(env, name);
    if (fallbackUrl) return fallbackUrl;
  }

  throw new Error(
    `Missing database connection string. Configure DATABASE_URL or ${fallbackNames.join(
      " / "
    )}.`
  );
}

export async function resolvePreferredPostgresTarget(
  databaseUrl: string,
  lookup: LookupFn = dns.lookup
): Promise<PreferredPostgresTarget> {
  const parsed = new URL(databaseUrl);
  const hostname = parsed.hostname;
  const port = parsed.port ? Number(parsed.port) : 5432;
  const ipFamily = net.isIP(hostname);

  if (ipFamily === 4 || ipFamily === 6) {
    return {
      connectHost: hostname,
      port,
      tlsServername: undefined,
    };
  }

  try {
    const addresses = await lookup(hostname, { family: 4, all: true });
    const ipv4Address = addresses.find((address) => address.family === 4)?.address;

    if (ipv4Address) {
      return {
        connectHost: ipv4Address,
        port,
        tlsServername: hostname,
      };
    }
  } catch {
    // Fall back to the original hostname if IPv4 lookup fails.
  }

  return {
    connectHost: hostname,
    port,
    tlsServername: hostname,
  };
}

export async function createPreferredPostgresSocket(
  databaseUrl: string,
  lookup?: LookupFn
): Promise<ConnectedSocket> {
  const target = await resolvePreferredPostgresTarget(databaseUrl, lookup);
  const socket = new net.Socket() as ConnectedSocket;

  await new Promise<void>((resolve, reject) => {
    socket.once("error", reject);
    socket.connect(target.port, target.connectHost, () => {
      socket.off("error", reject);
      resolve();
    });
  });

  socket.host = target.tlsServername ?? target.connectHost;
  socket.port = target.port;

  return socket;
}

function isLoopbackHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

export function getPostgresClientOptions(
  databaseUrl: string | undefined
): PostgresClientOptions {
  if (!databaseUrl) {
    return {};
  }

  let hostname: string;
  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    return {};
  }

  if (isLoopbackHostname(hostname)) {
    return {};
  }

  return {
    socket: () => createPreferredPostgresSocket(databaseUrl),
  };
}
