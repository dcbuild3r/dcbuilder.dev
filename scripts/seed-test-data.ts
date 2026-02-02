/**
 * Seed script to populate test data for E2E tests
 * Run with: bunx dotenv -e .env.local -- bun run scripts/seed-test-data.ts
 *
 * This creates deterministic test data that E2E tests can rely on.
 * Use TEST_MODE=true environment variable to only seed when appropriate.
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

// Deterministic test IDs for reliable test assertions
const TEST_PREFIX = "test-";

const testJobTags = [
  { id: `${TEST_PREFIX}tag-ai`, slug: "ai", label: "AI" },
  { id: `${TEST_PREFIX}tag-defi`, slug: "defi", label: "DeFi" },
  { id: `${TEST_PREFIX}tag-protocol`, slug: "protocol", label: "Protocol" },
  { id: `${TEST_PREFIX}tag-infra`, slug: "infra", label: "Infrastructure" },
  { id: `${TEST_PREFIX}tag-frontend`, slug: "frontend", label: "Frontend" },
  { id: `${TEST_PREFIX}tag-backend`, slug: "backend", label: "Backend" },
  { id: `${TEST_PREFIX}tag-rust`, slug: "rust", label: "Rust" },
];

const testJobRoles = [
  { id: `${TEST_PREFIX}role-eng`, slug: "engineering", label: "Engineering" },
  { id: `${TEST_PREFIX}role-design`, slug: "design", label: "Design" },
  { id: `${TEST_PREFIX}role-product`, slug: "product", label: "Product" },
  { id: `${TEST_PREFIX}role-research`, slug: "research", label: "Research" },
];

const testJobs = [
  {
    id: `${TEST_PREFIX}job-1`,
    title: "Senior Software Engineer",
    company: "Test Company Alpha",
    companyLogo: "/images/test/alpha.png",
    companyWebsite: "https://alpha.example.com",
    link: "https://alpha.example.com/careers/senior-engineer",
    location: "Remote",
    remote: "Remote",
    type: "Full-time",
    department: "Engineering",
    category: "portfolio",
    featured: true,
    tags: ["ai", "protocol", "rust"],
    description: "Join our team as a Senior Software Engineer.",
  },
  {
    id: `${TEST_PREFIX}job-2`,
    title: "Frontend Developer",
    company: "Test Company Beta",
    companyLogo: "/images/test/beta.png",
    companyWebsite: "https://beta.example.com",
    link: "https://beta.example.com/careers/frontend",
    location: "New York, NY",
    remote: "Hybrid",
    type: "Full-time",
    department: "Engineering",
    category: "portfolio",
    featured: false,
    tags: ["frontend", "defi"],
    description: "Build beautiful user interfaces for DeFi applications.",
  },
  {
    id: `${TEST_PREFIX}job-3`,
    title: "Protocol Researcher",
    company: "Test Company Gamma",
    companyLogo: "/images/test/gamma.png",
    companyWebsite: "https://gamma.example.com",
    link: "https://gamma.example.com/careers/researcher",
    location: "Remote",
    remote: "Remote",
    type: "Full-time",
    department: "Research",
    category: "network",
    featured: true,
    tags: ["protocol", "infra"],
    description: "Research and design next-generation protocols.",
  },
];

const testCandidates = [
  {
    id: `${TEST_PREFIX}candidate-1`,
    name: "Alice Test",
    title: "Senior Protocol Engineer",
    location: "Remote",
    summary: "Experienced protocol engineer with focus on ZK systems.",
    skills: ["protocol", "rust", "zkp"],
    experience: "5-10",
    availability: "looking",
    featured: true,
    x: "https://x.com/alicetest",
    github: "https://github.com/alicetest",
    email: "alice@test.example.com",
  },
  {
    id: `${TEST_PREFIX}candidate-2`,
    name: "Bob Test",
    title: "Full Stack Developer",
    location: "San Francisco, CA",
    summary: "Full stack developer specializing in DeFi frontends.",
    skills: ["defi", "frontend", "typescript"],
    experience: "3-5",
    availability: "open",
    featured: false,
    github: "https://github.com/bobtest",
    linkedin: "https://linkedin.com/in/bobtest",
  },
];

const testCuratedLinks = [
  {
    id: `${TEST_PREFIX}news-1`,
    title: "Test Article: Understanding ZK Proofs",
    url: "https://example.com/zk-proofs",
    source: "Test Publisher",
    date: new Date("2025-01-15"),
    description: "A comprehensive guide to zero-knowledge proofs.",
    category: "research",
    featured: true,
  },
  {
    id: `${TEST_PREFIX}news-2`,
    title: "Test Article: DeFi Market Update",
    url: "https://example.com/defi-update",
    source: "Test News",
    date: new Date("2025-01-10"),
    description: "Latest developments in the DeFi ecosystem.",
    category: "defi",
    featured: false,
  },
];

const testInvestmentCategories = [
  { id: `${TEST_PREFIX}cat-crypto`, slug: "crypto", label: "Crypto", color: "amber" },
  { id: `${TEST_PREFIX}cat-ai`, slug: "ai", label: "AI", color: "violet" },
  { id: `${TEST_PREFIX}cat-defi`, slug: "defi", label: "DeFi", color: "green" },
];

const testInvestments = [
  {
    id: `${TEST_PREFIX}inv-1`,
    title: "Test Protocol Alpha",
    description: "A test protocol for E2E testing",
    logo: "/images/test/alpha.png",
    tier: "1",
    featured: true,
    status: "active",
    categories: ["crypto", "defi"],
    website: "https://alpha.example.com",
    x: "https://x.com/testalpha",
  },
  {
    id: `${TEST_PREFIX}inv-2`,
    title: "Test Labs Beta",
    description: "Another test investment",
    logo: "/images/test/beta.png",
    tier: "2",
    featured: false,
    status: "active",
    categories: ["ai"],
    website: "https://beta.example.com",
    github: "https://github.com/testbeta",
  },
];

async function cleanTestData() {
  console.log("Cleaning existing test data...\n");

  // Delete test data using the prefix pattern
  await db.delete(jobs).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(candidates).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(curatedLinks).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(investments).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(investmentCategories).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(jobTags).where(sql`id LIKE ${TEST_PREFIX + "%"}`);
  await db.delete(jobRoles).where(sql`id LIKE ${TEST_PREFIX + "%"}`);

  console.log("  ✓ Cleaned test data\n");
}

async function seedTestData() {
  console.log("Seeding test data...\n");

  // Seed job tags
  console.log("Job Tags:");
  for (const tag of testJobTags) {
    await db.insert(jobTags).values(tag).onConflictDoNothing();
    console.log(`  ✓ ${tag.label}`);
  }

  // Seed job roles
  console.log("\nJob Roles:");
  for (const role of testJobRoles) {
    await db.insert(jobRoles).values(role).onConflictDoNothing();
    console.log(`  ✓ ${role.label}`);
  }

  // Seed jobs
  console.log("\nJobs:");
  for (const job of testJobs) {
    await db.insert(jobs).values(job).onConflictDoNothing();
    console.log(`  ✓ ${job.title} at ${job.company}`);
  }

  // Seed candidates
  console.log("\nCandidates:");
  for (const candidate of testCandidates) {
    await db.insert(candidates).values(candidate).onConflictDoNothing();
    console.log(`  ✓ ${candidate.name}`);
  }

  // Seed curated links
  console.log("\nCurated Links:");
  for (const link of testCuratedLinks) {
    await db.insert(curatedLinks).values(link).onConflictDoNothing();
    console.log(`  ✓ ${link.title}`);
  }

  // Seed investment categories
  console.log("\nInvestment Categories:");
  for (const category of testInvestmentCategories) {
    await db.insert(investmentCategories).values(category).onConflictDoNothing();
    console.log(`  ✓ ${category.label}`);
  }

  // Seed investments
  console.log("\nInvestments:");
  for (const investment of testInvestments) {
    await db.insert(investments).values(investment).onConflictDoNothing();
    console.log(`  ✓ ${investment.title}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cleanOnly = args.includes("--clean");
  const seedOnly = args.includes("--seed");

  try {
    if (cleanOnly) {
      await cleanTestData();
    } else if (seedOnly) {
      await seedTestData();
    } else {
      // Default: clean then seed
      await cleanTestData();
      await seedTestData();
    }

    console.log("\n✅ Test data seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding test data:", error);
    process.exit(1);
  }
}

main();
