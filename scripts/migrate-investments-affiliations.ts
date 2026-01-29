#!/usr/bin/env bun
/**
 * Migration script to populate investments and affiliations from static data
 * Run with: bun run scripts/migrate-investments-affiliations.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { investments as investmentsData } from "../src/data/investments";
import { affiliations as affiliationsData } from "../src/data/affiliations";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is required");
  process.exit(1);
}

const queryClient = postgres(connectionString);
const db = drizzle(queryClient, { schema });

async function migrateInvestments() {
  console.log("\n📦 Migrating investments...");
  let success = 0;
  let failed = 0;

  for (const inv of investmentsData) {
    try {
      await db.insert(schema.investments).values({
        title: inv.title,
        description: inv.description,
        imageUrl: inv.imageUrl,
        logo: inv.logo,
        tier: String(inv.tier),
        featured: inv.featured,
        status: inv.status || "active",
        x: inv.x || null,
        github: inv.github || null,
      });

      success++;
      console.log(`  ✅ ${inv.title}`);
    } catch (error) {
      failed++;
      console.log(`  ❌ ${inv.title}: ${error}`);
    }
  }

  console.log(`\nInvestments: ${success} migrated, ${failed} failed`);
  return { success, failed };
}

async function migrateAffiliations() {
  console.log("\n🏢 Migrating affiliations...");
  let success = 0;
  let failed = 0;

  for (const aff of affiliationsData) {
    try {
      await db.insert(schema.affiliations).values({
        title: aff.title,
        role: aff.role,
        dateBegin: aff.dateBegin,
        dateEnd: aff.dateEnd,
        description: aff.description,
        imageUrl: aff.imageUrl,
        logo: aff.logo,
      });

      success++;
      console.log(`  ✅ ${aff.title}`);
    } catch (error) {
      failed++;
      console.log(`  ❌ ${aff.title}: ${error}`);
    }
  }

  console.log(`\nAffiliations: ${success} migrated, ${failed} failed`);
  return { success, failed };
}

async function main() {
  console.log("🚀 Starting migration...");

  const invResult = await migrateInvestments();
  const affResult = await migrateAffiliations();

  console.log("\n📊 Migration complete!");
  console.log(`   Investments: ${invResult.success}/${investmentsData.length}`);
  console.log(`   Affiliations: ${affResult.success}/${affiliationsData.length}`);

  // Close the database connection
  await queryClient.end();

  if (invResult.failed > 0 || affResult.failed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
