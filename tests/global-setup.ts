/**
 * Global setup for Playwright E2E tests
 * Seeds test data before all tests run
 */

import {
  jobs,
  jobTags,
  jobRoles,
  candidates,
  curatedLinks,
  investments,
  investmentCategories,
} from "../src/db/schema";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import * as dbSchema from "../src/db/schema";

const TEST_PREFIX = "test-";

loadEnvConfig(process.cwd());

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for E2E tests");
  }
  return connectionString;
}

async function ensureDatabaseSchema(connectionString: string) {
  const migrationClient = postgres(connectionString, { max: 1, onnotice: () => {} });
  try {
    const migrationDb = drizzle(migrationClient);
    try {
      await migrate(migrationDb, {
        migrationsFolder: resolve(process.cwd(), "drizzle"),
      });
    } catch (error) {
      const code = (error as { cause?: { code?: string } })?.cause?.code;
      if (code !== "42P07") {
        throw error;
      }
      // If migration history drift exists (some tables already created but journal is incomplete),
      // bootstrap the tables required by E2E to keep local setup reliable.
      console.log("⚠️  Migration journal drift detected, applying E2E schema bootstrap...");
      await ensureE2ESchema(migrationDb);
    }
  } finally {
    await migrationClient.end();
  }
}

async function ensureE2ESchema(db: PostgresJsDatabase<Record<string, never>>) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "jobs" (
      "id" text PRIMARY KEY NOT NULL,
      "title" text NOT NULL,
      "company" text NOT NULL,
      "company_logo" text,
      "link" text NOT NULL,
      "location" text,
      "remote" text,
      "type" text,
      "salary" text,
      "department" text,
      "tags" text[],
      "category" text NOT NULL,
      "featured" boolean DEFAULT false,
      "description" text,
      "responsibilities" text[],
      "qualifications" text[],
      "benefits" text[],
      "company_website" text,
      "company_x" text,
      "company_github" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "candidates" (
      "id" text PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "title" text,
      "location" text,
      "summary" text,
      "skills" text[],
      "experience" text,
      "education" text,
      "image" text,
      "cv" text,
      "featured" boolean DEFAULT false,
      "available" boolean DEFAULT true,
      "availability" text DEFAULT 'looking',
      "email" text,
      "telegram" text,
      "calendly" text,
      "x" text,
      "github" text,
      "linkedin" text,
      "website" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "curated_links" (
      "id" text PRIMARY KEY NOT NULL,
      "title" text NOT NULL,
      "url" text NOT NULL,
      "source" text NOT NULL,
      "source_image" text,
      "date" timestamp NOT NULL,
      "description" text,
      "category" text NOT NULL,
      "featured" boolean DEFAULT false,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "investments" (
      "id" text PRIMARY KEY NOT NULL,
      "title" text NOT NULL,
      "description" text,
      "image_url" text,
      "logo" text,
      "tier" text,
      "featured" boolean DEFAULT false,
      "status" text DEFAULT 'active',
      "categories" text[],
      "website" text,
      "x" text,
      "github" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "investment_categories" (
      "id" text PRIMARY KEY NOT NULL,
      "slug" text NOT NULL UNIQUE,
      "label" text NOT NULL,
      "color" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "job_tags" (
      "id" text PRIMARY KEY NOT NULL,
      "slug" text NOT NULL UNIQUE,
      "label" text NOT NULL,
      "color" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "job_roles" (
      "id" text PRIMARY KEY NOT NULL,
      "slug" text NOT NULL UNIQUE,
      "label" text NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "available" boolean DEFAULT true`);
  await db.execute(sql`ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "availability" text DEFAULT 'looking'`);
  await db.execute(sql`ALTER TABLE "curated_links" ADD COLUMN IF NOT EXISTS "source_image" text`);
  await db.execute(sql`ALTER TABLE "investments" ADD COLUMN IF NOT EXISTS "categories" text[]`);
}

// Test data definitions (keep in sync with scripts/seed-test-data.ts)
const testJobTags = [
  { id: `${TEST_PREFIX}tag-ai`, slug: "ai", label: "AI" },
  { id: `${TEST_PREFIX}tag-defi`, slug: "defi", label: "DeFi" },
  { id: `${TEST_PREFIX}tag-protocol`, slug: "protocol", label: "Protocol" },
  { id: `${TEST_PREFIX}tag-infra`, slug: "infra", label: "Infrastructure" },
  { id: `${TEST_PREFIX}tag-frontend`, slug: "frontend", label: "Frontend" },
];

const testJobRoles = [
  { id: `${TEST_PREFIX}role-eng`, slug: "engineering", label: "Engineering" },
  { id: `${TEST_PREFIX}role-design`, slug: "design", label: "Design" },
  { id: `${TEST_PREFIX}role-product`, slug: "product", label: "Product" },
];

const testJobs = [
  {
    id: `${TEST_PREFIX}job-1`,
    title: "Senior Software Engineer",
    company: "Test Company Alpha",
    companyWebsite: "https://alpha.example.com",
    link: "https://alpha.example.com/careers/senior-engineer",
    location: "Remote",
    remote: "Remote",
    type: "Full-time",
    department: "Engineering",
    category: "portfolio",
    featured: true,
    tags: ["ai", "protocol"],
    description: "Join our team as a Senior Software Engineer.",
  },
  {
    id: `${TEST_PREFIX}job-2`,
    title: "Frontend Developer",
    company: "Test Company Beta",
    companyWebsite: "https://beta.example.com",
    link: "https://beta.example.com/careers/frontend",
    location: "New York, NY",
    remote: "Hybrid",
    type: "Full-time",
    department: "Engineering",
    category: "portfolio",
    featured: false,
    tags: ["frontend", "defi"],
    description: "Build beautiful user interfaces.",
  },
];

const testCandidates = [
  {
    id: `${TEST_PREFIX}candidate-1`,
    name: "Alice Test",
    title: "Senior Protocol Engineer",
    location: "Remote",
    summary: "Experienced protocol engineer.",
    skills: ["protocol", "rust"],
    experience: "5-10",
    availability: "looking",
    featured: true,
    email: "alice@test.example.com",
  },
];

const testInvestmentCategories = [
  { id: `${TEST_PREFIX}cat-crypto`, slug: "crypto", label: "Crypto", color: "amber" },
  { id: `${TEST_PREFIX}cat-ai`, slug: "ai", label: "AI", color: "violet" },
];

const testInvestments = [
  {
    id: `${TEST_PREFIX}inv-1`,
    title: "Test Protocol Alpha",
    description: "A test protocol",
    tier: "1",
    featured: true,
    status: "active",
    categories: ["crypto"],
    website: "https://alpha.example.com",
  },
];

async function cleanTestData(db: PostgresJsDatabase<typeof dbSchema>) {
  await db.delete(jobs).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(candidates).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(curatedLinks).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(investments).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(investmentCategories).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(jobTags).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(jobRoles).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
}

async function seedTestData(db: PostgresJsDatabase<typeof dbSchema>) {
  for (const tag of testJobTags) {
    await db.insert(jobTags).values(tag).onConflictDoNothing();
  }

  for (const role of testJobRoles) {
    await db.insert(jobRoles).values(role).onConflictDoNothing();
  }

  for (const job of testJobs) {
    await db.insert(jobs).values(job).onConflictDoNothing();
  }

  for (const candidate of testCandidates) {
    await db.insert(candidates).values(candidate).onConflictDoNothing();
  }

  for (const category of testInvestmentCategories) {
    await db.insert(investmentCategories).values(category).onConflictDoNothing();
  }

  for (const investment of testInvestments) {
    await db.insert(investments).values(investment).onConflictDoNothing();
  }
}

export default async function globalSetup() {
  console.log("\n🌱 Setting up E2E test data...");

  const connectionString = getConnectionString();
  const queryClient = postgres(connectionString, { onnotice: () => {} });
  const testDb = drizzle(queryClient, { schema: dbSchema });

  try {
    await ensureDatabaseSchema(connectionString);
    await cleanTestData(testDb);
    await seedTestData(testDb);
    console.log("✅ Test data seeded successfully\n");
  } catch (error) {
    console.error("❌ Failed to seed test data:", error);
    throw error;
  } finally {
    await queryClient.end();
  }
}
