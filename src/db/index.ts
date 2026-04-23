import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getPostgresClientOptions } from "./postgres-connection";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// For query purposes
const queryClient = postgres(
  connectionString,
  getPostgresClientOptions(connectionString) as Parameters<typeof postgres>[1]
);
export const db = drizzle(queryClient, { schema });

// Re-export schema for convenience
export * from "./schema";
