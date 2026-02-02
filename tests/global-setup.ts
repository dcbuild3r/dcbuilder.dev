/**
 * Global setup for Playwright E2E tests
 * Seeds test data before all tests run
 */

import { db } from "../src/db";
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

const TEST_PREFIX = "test-";

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

async function cleanTestData() {
  await db.delete(jobs).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(candidates).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(curatedLinks).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(investments).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(investmentCategories).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(jobTags).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(jobRoles).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
}

async function seedTestData() {
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

  try {
    await cleanTestData();
    await seedTestData();
    console.log("✅ Test data seeded successfully\n");
  } catch (error) {
    console.error("❌ Failed to seed test data:", error);
    throw error;
  }
}
