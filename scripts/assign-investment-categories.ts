/**
 * Script to assign categories to all investments
 * Run with: bunx dotenv -e .env.local -- bun run scripts/assign-investment-categories.ts
 */

import { db, investments } from "../src/db";
import { eq } from "drizzle-orm";

// Category assignments based on investment focus
const categoryAssignments: Record<string, string[]> = {
  // Tier 1 Featured
  "Exo": ["AI", "Hardware"],
  "Lighter": ["DeFi", "Crypto"],
  "Lucis": ["Health/Longevity"],
  "MegaETH": ["L2", "Crypto"],
  "Monad": ["L1", "Crypto"],
  "Morpho": ["DeFi", "Crypto"],
  "Prime Intellect": ["AI"],

  // Tier 1
  "Accountable": ["DeFi", "ZK"],
  "Dria": ["AI"],
  "Edison": ["AI", "Security", "Agents"],
  "Friend": ["AI", "Social"],
  "Octet": ["ZK", "Crypto"],
  "OWN": ["DeFi", "Crypto"],
  "Phylax": ["Security"],

  // Tier 2
  "Agora": ["Governance", "Crypto"],
  "Aligned Layer": ["ZK", "L2"],
  "Delta": ["Crypto", "L1"],
  "Fabric Cryptography": ["Hardware", "ZK"],
  "Giza": ["AI", "Agents"],
  "Praxis": ["Network States"],
  "Rhinestone": ["Devtools", "Crypto"],
  "Sorella": ["MEV", "DeFi"],
  "Succinct": ["ZK"],
  "Wildcat": ["DeFi"],

  // Tier 3
  "Berachain": ["L1", "DeFi", "Crypto"],
  "Clique": ["Devtools", "Crypto"],
  "Herodotus": ["ZK"],
  "Inco": ["Privacy", "L2"],
  "Intuition": ["Social", "Crypto"],
  "Pimlico": ["Devtools", "Crypto"],
  "Ritual": ["AI", "L1"],
  "Zenith": ["Crypto"],

  // Tier 4
  "Astria": ["L2", "Crypto"],
  "Atoma": ["AI", "Privacy"],
  "blocksense": ["ZK", "Crypto"],
  "Eclipse": ["L2", "Crypto"],
  "GasHawk": ["MEV", "Devtools"],
  "Happy Chain": ["L2", "Social"],
  "JokeRace": ["Social", "Governance"],
  "Mind Palace": ["AI"],
  "Mizu": ["DeFi", "Crypto"],
  "Mode": ["L2", "DeFi", "AI", "Agents"],
  "Movement": ["L2", "Crypto"],
  "Nebra": ["ZK"],
  "Nillion": ["Privacy", "Crypto"],
  "OnlyDust": ["Devtools"],
  "OpenQ": ["Devtools"],
  "PIN AI": ["AI", "Privacy"],
  "Pluto": ["ZK", "Devtools"],
  "Pragma": ["DeFi", "Crypto"],
};

async function assignCategories() {
  console.log("Assigning categories to investments...\n");

  const allInvestments = await db.select().from(investments);
  let updated = 0;
  let skipped = 0;

  for (const inv of allInvestments) {
    const categories = categoryAssignments[inv.title];

    if (categories) {
      await db
        .update(investments)
        .set({ categories })
        .where(eq(investments.id, inv.id));
      console.log(`  ✓ ${inv.title}: ${categories.join(", ")}`);
      updated++;
    } else {
      console.log(`  - ${inv.title}: No categories defined (skipped)`);
      skipped++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
  process.exit(0);
}

assignCategories();
