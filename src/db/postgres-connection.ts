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
