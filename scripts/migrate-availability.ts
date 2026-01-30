import postgres from "postgres";

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = postgres(connectionString);

  console.log("Adding availability column...");
  await sql`ALTER TABLE candidates ADD COLUMN IF NOT EXISTS availability text DEFAULT 'looking'`;

  console.log("Migrating data from available to availability...");
  await sql`
    UPDATE candidates
    SET availability = CASE
      WHEN available = true THEN 'looking'
      WHEN available = false THEN 'not-looking'
      ELSE 'looking'
    END
    WHERE availability IS NULL OR availability = 'looking'
  `;

  console.log("Creating index...");
  await sql`CREATE INDEX IF NOT EXISTS candidates_availability_idx ON candidates(availability)`;

  console.log("Migration complete!");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
