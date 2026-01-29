import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

async function main() {
  const sql = postgres(connectionString);

  console.log("Creating investments table...");
  await sql`
    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      logo TEXT,
      tier TEXT,
      featured BOOLEAN DEFAULT false,
      status TEXT DEFAULT 'active',
      x TEXT,
      github TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  console.log("Creating investments indexes...");
  await sql`CREATE INDEX IF NOT EXISTS investments_tier_idx ON investments(tier)`;
  await sql`CREATE INDEX IF NOT EXISTS investments_featured_idx ON investments(featured)`;

  console.log("Creating affiliations table...");
  await sql`
    CREATE TABLE IF NOT EXISTS affiliations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      role TEXT NOT NULL,
      date_begin TEXT,
      date_end TEXT,
      description TEXT,
      image_url TEXT,
      logo TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `;

  console.log("Creating affiliations indexes...");
  await sql`CREATE INDEX IF NOT EXISTS affiliations_title_idx ON affiliations(title)`;

  console.log("Tables created successfully!");
  await sql.end();
}

main().catch(console.error);
