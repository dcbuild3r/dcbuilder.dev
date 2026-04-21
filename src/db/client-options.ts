import postgres from "postgres";
import { createPreferredPostgresSocket } from "./postgres-connection";

type DriverClientOptions = NonNullable<Parameters<typeof postgres>[1]>;

export type RuntimePostgresClientOptions = DriverClientOptions & {
  // `postgres` supports a custom socket factory at runtime, but the published
  // type surface does not currently expose it.
  socket?: () => ReturnType<typeof createPreferredPostgresSocket>;
};

function usesLocalHostname(databaseUrl: string): boolean {
  const hostname = new URL(databaseUrl).hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0"
  );
}

export function buildPostgresClientOptions(databaseUrl: string): RuntimePostgresClientOptions {
  if (usesLocalHostname(databaseUrl)) {
    return {};
  }

  return {
    socket: () => createPreferredPostgresSocket(databaseUrl),
  };
}
