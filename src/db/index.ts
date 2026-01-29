import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Lazy initialization to avoid issues at module load time
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _queryClient: ReturnType<typeof postgres> | null = null;

function getConnectionString(): string {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
      "Please configure it in your environment or .env.local file."
    );
  }
  return connectionString;
}

function createDbClient() {
  if (!_db) {
    const connectionString = getConnectionString();
    _queryClient = postgres(connectionString, {
      // Connection pool settings for serverless
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    _db = drizzle(_queryClient, { schema });
  }
  return _db;
}

// Export a proxy that lazily initializes the database
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const client = createDbClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

// Re-export schema for convenience
export * from "./schema";
