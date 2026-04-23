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
  max?: number;
  idle_timeout?: number;
  connect_timeout?: number;
};

type ConnectedSocket = net.Socket & {
  host: string;
  port: number;
};

const DEFAULT_POOL_MAX = 1;
const DEFAULT_IDLE_TIMEOUT_SECONDS = 20;
const DEFAULT_CONNECT_TIMEOUT_SECONDS = 10;

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
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
  const poolOptions: PostgresClientOptions = {
    max: readPositiveIntegerEnv("POSTGRES_POOL_MAX", DEFAULT_POOL_MAX),
    idle_timeout: readPositiveIntegerEnv(
      "POSTGRES_IDLE_TIMEOUT_SECONDS",
      DEFAULT_IDLE_TIMEOUT_SECONDS
    ),
    connect_timeout: readPositiveIntegerEnv(
      "POSTGRES_CONNECT_TIMEOUT_SECONDS",
      DEFAULT_CONNECT_TIMEOUT_SECONDS
    ),
  };

  if (!databaseUrl) {
    return poolOptions;
  }

  let hostname: string;
  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    return poolOptions;
  }

  if (isLoopbackHostname(hostname)) {
    return poolOptions;
  }

  return {
    ...poolOptions,
    socket: () => createPreferredPostgresSocket(databaseUrl),
  };
}
