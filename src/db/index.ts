import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  getPostgresClientOptions,
  resolveDatabaseUrl,
} from "./postgres-connection";
import * as schema from "./schema";

const connectionString = resolveDatabaseUrl();

// For query purposes
const queryClient = postgres(
  connectionString,
  getPostgresClientOptions(connectionString) as Parameters<typeof postgres>[1]
);
export const db = drizzle(queryClient, { schema });

// Re-export schema for convenience
export * from "./schema";
