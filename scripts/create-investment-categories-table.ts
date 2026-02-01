/**
 * Script to create the investment_categories table
 * Run with: bunx dotenv -e .env.local -- bun run scripts/create-investment-categories-table.ts
 */

import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString);

async function createTable() {
  console.log("Creating investment_categories table...\n");

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "investment_categories" (
        "id" text PRIMARY KEY NOT NULL,
        "slug" text NOT NULL,
        "label" text NOT NULL,
        "color" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "investment_categories_slug_unique" UNIQUE("slug")
      )
    `;
    console.log("  ✓ Table created (or already exists)");

    await sql`
      CREATE INDEX IF NOT EXISTS "investment_categories_slug_idx"
      ON "investment_categories" USING btree ("slug")
    `;
    console.log("  ✓ Index created (or already exists)");

    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

createTable();
