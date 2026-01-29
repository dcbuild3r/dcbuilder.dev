import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { jobs, candidates, curatedLinks } from "../src/db/schema";
import { createId } from "@paralleldrive/cuid2";

// Import static data
import { jobs as staticJobs } from "../src/data/jobs";
import { candidates as staticCandidates } from "../src/data/candidates";
import { curatedLinks as staticCuratedLinks } from "../src/data/news";

const connectionString = process.env.DATABASE_URL!;

async function main() {
  console.log("Starting migration...\n");

  const client = postgres(connectionString);
  const db = drizzle(client);

  // Migrate Jobs
  console.log(`Migrating ${staticJobs.length} jobs...`);
  let jobsCreated = 0;
  let jobsSkipped = 0;

  for (const job of staticJobs) {
    try {
      await db.insert(jobs).values({
        id: job.id || createId(),
        title: job.title,
        company: job.company.name,
        companyLogo: job.company.logo,
        link: job.link,
        location: job.location || null,
        remote: job.remote ? "Remote" : null,
        type: job.type || null,
        salary: job.salary || null,
        department: job.department || null,
        tags: job.tags || [],
        category: job.company.category,
        featured: job.featured || false,
        description: job.description || null,
        companyWebsite: job.company.website || null,
        companyX: job.company.x || null,
        companyGithub: job.company.github || null,
      });
      jobsCreated++;
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === "23505") {
        // Duplicate key
        jobsSkipped++;
      } else {
        console.error(`Failed to migrate job ${job.id}:`, error);
      }
    }
  }
  console.log(`  Created: ${jobsCreated}, Skipped (duplicates): ${jobsSkipped}\n`);

  // Migrate Candidates
  console.log(`Migrating ${staticCandidates.length} candidates...`);
  let candidatesCreated = 0;
  let candidatesSkipped = 0;

  for (const candidate of staticCandidates) {
    try {
      await db.insert(candidates).values({
        id: candidate.id || createId(),
        name: candidate.visibility === "anonymous"
          ? (candidate.anonymousAlias || "Anonymous")
          : candidate.name,
        title: candidate.title || null,
        location: candidate.location || null,
        summary: candidate.bio || null,
        skills: candidate.skills || [],
        experience: candidate.experience || null,
        education: null, // Not in static data
        image: candidate.profileImage || null,
        cv: candidate.socials?.cv || null,
        featured: candidate.featured || false,
        available: candidate.availability !== "not-looking",
        email: candidate.socials?.email || null,
        telegram: candidate.socials?.telegram || null,
        calendly: null, // Not in static data
        x: candidate.socials?.x || null,
        github: candidate.socials?.github || null,
        linkedin: candidate.socials?.linkedin || null,
        website: candidate.socials?.website || null,
      });
      candidatesCreated++;
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === "23505") {
        candidatesSkipped++;
      } else {
        console.error(`Failed to migrate candidate ${candidate.id}:`, error);
      }
    }
  }
  console.log(`  Created: ${candidatesCreated}, Skipped (duplicates): ${candidatesSkipped}\n`);

  // Migrate Curated Links (News)
  console.log(`Migrating ${staticCuratedLinks.length} curated links...`);
  let linksCreated = 0;
  let linksSkipped = 0;

  for (const link of staticCuratedLinks) {
    try {
      await db.insert(curatedLinks).values({
        id: link.id || createId(),
        title: link.title,
        url: link.url,
        source: link.source,
        date: new Date(link.date),
        description: link.description || null,
        category: link.category,
        featured: link.featured || false,
      });
      linksCreated++;
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === "23505") {
        linksSkipped++;
      } else {
        console.error(`Failed to migrate curated link ${link.id}:`, error);
      }
    }
  }
  console.log(`  Created: ${linksCreated}, Skipped (duplicates): ${linksSkipped}\n`);

  console.log("Migration complete!");
  console.log(`Summary:`);
  console.log(`  Jobs: ${jobsCreated} created, ${jobsSkipped} skipped`);
  console.log(`  Candidates: ${candidatesCreated} created, ${candidatesSkipped} skipped`);
  console.log(`  Curated Links: ${linksCreated} created, ${linksSkipped} skipped`);

  await client.end();
}

main().catch(console.error);
