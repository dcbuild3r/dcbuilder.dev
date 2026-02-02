import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

// Existing tags from src/data/jobs.ts
const existingTags = [
  { slug: "hot", label: "🔥 HOT", color: "orange" },
  { slug: "top", label: "⭐ TOP", color: "amber" },
  { slug: "ai", label: "AI", color: "purple" },
  { slug: "ml", label: "ML", color: "purple" },
  { slug: "mev", label: "MEV", color: "red" },
  { slug: "health", label: "Health", color: "green" },
  { slug: "cryptography", label: "Cryptography", color: "blue" },
  { slug: "zkp", label: "ZKP", color: "blue" },
  { slug: "protocol", label: "Protocol", color: "indigo" },
  { slug: "defi", label: "DeFi", color: "emerald" },
  { slug: "infra", label: "Infrastructure", color: "slate" },
  { slug: "trading", label: "Trading", color: "green" },
  { slug: "gaming", label: "Gaming", color: "pink" },
  { slug: "design", label: "Design", color: "rose" },
  { slug: "marketing", label: "Marketing", color: "orange" },
  { slug: "bd", label: "BD", color: "cyan" },
  { slug: "research", label: "Research", color: "violet" },
  { slug: "security", label: "Security", color: "red" },
  { slug: "legal", label: "Legal", color: "gray" },
  { slug: "world", label: "World", color: "blue" },
  { slug: "monad-ecosystem", label: "Monad Ecosystem", color: "purple" },
  { slug: "berachain-ecosystem", label: "Berachain Ecosystem", color: "amber" },
  { slug: "entry-level", label: "Entry Level", color: "green" },
  { slug: "vc", label: "VC", color: "indigo" },
  { slug: "accounting", label: "Accounting", color: "gray" },
  { slug: "bci", label: "BCI", color: "cyan" },
  { slug: "hardware", label: "Hardware", color: "slate" },
  { slug: "talent", label: "Talent", color: "pink" },
  { slug: "leadership", label: "Leadership", color: "amber" },
  { slug: "management", label: "Management", color: "amber" },
  { slug: "product", label: "Product", color: "blue" },
  { slug: "solana", label: "Solana", color: "purple" },
  { slug: "internship", label: "Internship", color: "green" },
  { slug: "growth", label: "Growth", color: "emerald" },
  { slug: "sales", label: "Sales", color: "orange" },
  { slug: "account-abstraction", label: "Account Abstraction", color: "indigo" },
  { slug: "privacy", label: "Privacy", color: "gray" },
  { slug: "web3", label: "Web3", color: "purple" },
  { slug: "frontend", label: "Frontend", color: "sky" },
  { slug: "backend", label: "Backend", color: "slate" },
  { slug: "fullstack", label: "Full Stack", color: "blue" },
  { slug: "rust", label: "Rust", color: "orange" },
  { slug: "mobile", label: "Mobile", color: "green" },
  { slug: "android", label: "Android", color: "green" },
  { slug: "ios", label: "iOS", color: "gray" },
];

// Common job roles/departments
const existingRoles = [
  { slug: "engineering", label: "Engineering" },
  { slug: "design", label: "Design" },
  { slug: "product", label: "Product" },
  { slug: "marketing", label: "Marketing" },
  { slug: "sales", label: "Sales" },
  { slug: "operations", label: "Operations" },
  { slug: "finance", label: "Finance" },
  { slug: "legal", label: "Legal" },
  { slug: "hr", label: "Human Resources" },
  { slug: "research", label: "Research" },
  { slug: "data", label: "Data" },
  { slug: "security", label: "Security" },
  { slug: "devrel", label: "Developer Relations" },
  { slug: "community", label: "Community" },
  { slug: "content", label: "Content" },
  { slug: "support", label: "Support" },
  { slug: "business-development", label: "Business Development" },
  { slug: "strategy", label: "Strategy" },
  { slug: "executive", label: "Executive" },
];

async function migrate() {
  console.log("Creating job_tags table...");
  await sql`
    CREATE TABLE IF NOT EXISTS job_tags (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      color TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS job_tags_slug_idx ON job_tags(slug)`;

  console.log("Creating job_roles table...");
  await sql`
    CREATE TABLE IF NOT EXISTS job_roles (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS job_roles_slug_idx ON job_roles(slug)`;

  console.log("Seeding job_tags...");
  for (const tag of existingTags) {
    try {
      await sql`
        INSERT INTO job_tags (id, slug, label, color)
        VALUES (gen_random_uuid()::text, ${tag.slug}, ${tag.label}, ${tag.color})
        ON CONFLICT (slug) DO UPDATE SET label = ${tag.label}, color = ${tag.color}
      `;
      console.log(`  ✓ ${tag.slug}`);
    } catch (e) {
      console.log(`  ✗ ${tag.slug}:`, e);
    }
  }

  console.log("Seeding job_roles...");
  for (const role of existingRoles) {
    try {
      await sql`
        INSERT INTO job_roles (id, slug, label)
        VALUES (gen_random_uuid()::text, ${role.slug}, ${role.label})
        ON CONFLICT (slug) DO UPDATE SET label = ${role.label}
      `;
      console.log(`  ✓ ${role.slug}`);
    } catch (e) {
      console.log(`  ✗ ${role.slug}:`, e);
    }
  }

  // Also extract unique departments from existing jobs and add them
  console.log("\nExtracting existing departments from jobs...");
  const existingDepartments = await sql`
    SELECT DISTINCT department FROM jobs WHERE department IS NOT NULL AND department != ''
  `;

  for (const row of existingDepartments) {
    const dept = row.department as string;
    const slug = dept.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      await sql`
        INSERT INTO job_roles (id, slug, label)
        VALUES (gen_random_uuid()::text, ${slug}, ${dept})
        ON CONFLICT (slug) DO NOTHING
      `;
      console.log(`  ✓ Added role from job: ${dept}`);
    } catch {
      // Ignore conflicts
    }
  }

  // Extract unique tags from existing jobs and add them
  console.log("\nExtracting existing tags from jobs...");
  const jobsWithTags = await sql`
    SELECT DISTINCT unnest(tags) as tag FROM jobs WHERE tags IS NOT NULL
  `;

  for (const row of jobsWithTags) {
    const tag = row.tag as string;
    if (!tag) continue;
    const existingTag = existingTags.find(t => t.slug === tag);
    if (!existingTag) {
      // This is a tag in the DB that wasn't in our hardcoded list
      const label = tag.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      try {
        await sql`
          INSERT INTO job_tags (id, slug, label)
          VALUES (gen_random_uuid()::text, ${tag}, ${label})
          ON CONFLICT (slug) DO NOTHING
        `;
        console.log(`  ✓ Added tag from job: ${tag} -> ${label}`);
      } catch {
        // Ignore conflicts
      }
    }
  }

  console.log("\n✅ Migration complete!");
  await sql.end();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
