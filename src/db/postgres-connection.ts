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
  max?: number;
  idle_timeout?: number;
  connect_timeout?: number;
  prepare?: boolean;
  socket?: () => Promise<ConnectedSocket>;
};

type ConnectedSocket = net.Socket & {
  host: string;
  port: number;
};

type PostgresSocketOptions = {
  timeoutMs?: number;
  socketFactory?: () => net.Socket;
};

const DEFAULT_CONNECT_TIMEOUT_MS = 2_000;

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
  lookup?: LookupFn,
  options: PostgresSocketOptions = {}
): Promise<ConnectedSocket> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
  let socket: ConnectedSocket | undefined;

  return new Promise<ConnectedSocket>((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error, connectedSocket?: ConnectedSocket) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(connectedSocket!);
    };
    const timer = setTimeout(() => {
      const error = new Error(
        `PostgreSQL connection timed out after ${timeoutMs}ms`
      ) as Error & { code?: string };
      error.code = "ETIMEDOUT";
      socket?.destroy();
      finish(error);
    }, timeoutMs);

    void resolvePreferredPostgresTarget(databaseUrl, lookup)
      .then((target) => {
        if (settled) return;
        socket = (options.socketFactory?.() ?? new net.Socket()) as ConnectedSocket;
        const onError = (error: Error) => finish(error);
        socket.once("error", onError);
        socket.connect(target.port, target.connectHost, () => {
          socket?.off("error", onError);
          if (!socket) return;
          socket.host = target.tlsServername ?? target.connectHost;
          socket.port = target.port;
          finish(undefined, socket);
        });
      })
      .catch((error: unknown) =>
        finish(error instanceof Error ? error : new Error(String(error)))
      );
  });
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
    max: 2,
    idle_timeout: 10,
    connect_timeout: DEFAULT_CONNECT_TIMEOUT_MS / 1_000,
    prepare: false,
    socket: () => createPreferredPostgresSocket(databaseUrl),
  };
}
