import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { apiKeys } from "../src/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { randomBytes } from "crypto";

const connectionString = process.env.DATABASE_URL!;

async function main() {
  const name = process.argv[2] || "Admin";
  const permissions = process.argv[3]?.split(",") || ["*"];

  const client = postgres(connectionString);
  const db = drizzle(client);

  // Generate a secure random key
  const key = `dcb_${randomBytes(32).toString("hex")}`;

  const [created] = await db
    .insert(apiKeys)
    .values({
      id: createId(),
      name,
      key,
      permissions,
    })
    .returning();

  console.log("\n✅ API Key created successfully!\n");
  console.log("Name:", created.name);
  console.log("Permissions:", created.permissions?.join(", "));
  console.log("\n🔑 API Key (save this, it won't be shown again):\n");
  console.log(key);
  console.log("\nUsage:");
  console.log(`  curl -H "x-api-key: ${key}" http://localhost:3000/api/v1/jobs`);
  console.log("");

  await client.end();
}

main().catch(console.error);
