/**
 * Seed script to populate investment_categories table from existing INVESTMENT_CATEGORIES constant
 * Run with: bunx dotenv -e .env.local -- bun run scripts/seed-investment-categories.ts
 */

import { db, investmentCategories, INVESTMENT_CATEGORIES } from "../src/db";

// Color assignments for categories (matching common semantic associations)
const categoryColors: Record<string, string> = {
  "Crypto": "amber",
  "AI": "violet",
  "DeFi": "green",
  "MEV": "orange",
  "Privacy": "slate",
  "Health/Longevity": "rose",
  "Security": "red",
  "L1": "blue",
  "L2": "sky",
  "Governance": "purple",
  "Agents": "fuchsia",
  "Hardware": "neutral",
  "Devtools": "teal",
  "Social": "pink",
  "Network States": "indigo",
  "ZK": "cyan",
};

function toSlug(label: string): string {
  return label.toLowerCase().replace(/\//g, "-").replace(/\s+/g, "-");
}

async function seed() {
  console.log("Seeding investment categories...\n");

  for (const label of INVESTMENT_CATEGORIES) {
    const slug = toSlug(label);
    const color = categoryColors[label] || null;

    try {
      const [inserted] = await db
        .insert(investmentCategories)
        .values({ slug, label, color })
        .onConflictDoNothing()
        .returning();

      if (inserted) {
        console.log(`  ✓ Created: ${label} (slug: ${slug}, color: ${color || "none"})`);
      } else {
        console.log(`  - Skipped (exists): ${label}`);
      }
    } catch (error) {
      console.error(`  ✗ Error creating ${label}:`, error);
    }
  }

  console.log("\nSeeding complete!");
  process.exit(0);
}

seed();
