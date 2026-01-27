# Jobs Board Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Jobs page that aggregates job listings from companies in your network, with filtering by category and search.

**Architecture:** Static data file (`jobs.ts`) with typed job listings, a `JobsGrid` client component for filtering/search, and a new `/jobs` route. Reuses existing patterns from PortfolioGrid.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, React useState/useMemo

---

## Task 1: Create Jobs Data File

**Files:**
- Create: `src/data/jobs.ts`

**Step 1: Write the data file with types and initial structure**

```typescript
export type RelationshipCategory = "portfolio" | "network";

export type JobType = "full-time" | "part-time" | "contract" | "internship";

export interface Company {
  name: string;
  logo: string; // path to logo in /public/images/investments/
  website: string;
  category: RelationshipCategory;
}

export interface Job {
  id: string;
  title: string;
  company: Company;
  location: string;
  remote?: boolean;
  type?: JobType;
  department?: string;
  salary?: string;
  link: string;
  featured?: boolean;
}

// Reusable company definitions to avoid repetition
const companies = {
  monad: {
    name: "Monad",
    logo: "/images/investments/monad.jpg",
    website: "https://www.monad.xyz/",
    category: "portfolio" as const,
  },
  megaeth: {
    name: "MegaETH",
    logo: "/images/investments/megaeth.jpg",
    website: "https://megaeth.systems/",
    category: "portfolio" as const,
  },
  // Add more companies as needed
};

export const jobs: Job[] = [
  {
    id: "monad-rust-engineer",
    title: "Senior Rust Engineer",
    company: companies.monad,
    location: "New York, NY",
    remote: true,
    type: "full-time",
    department: "Engineering",
    link: "https://www.monad.xyz/careers",
    featured: true,
  },
  {
    id: "megaeth-protocol-engineer",
    title: "Protocol Engineer",
    company: companies.megaeth,
    location: "Remote",
    remote: true,
    type: "full-time",
    department: "Engineering",
    link: "https://megaeth.systems/careers",
    featured: true,
  },
  // Add more jobs as needed
];
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/data/jobs.ts
git commit -m "feat(jobs): add jobs data file with types"
```

---

## Task 2: Create JobsGrid Component

**Files:**
- Create: `src/components/JobsGrid.tsx`

**Step 1: Create the client component with filtering and search**

```typescript
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Job, RelationshipCategory } from "@/data/jobs";

type FilterCategory = "all" | RelationshipCategory;

interface JobsGridProps {
  jobs: Job[];
}

export function JobsGrid({ jobs }: JobsGridProps) {
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Category filter
      if (filterCategory !== "all" && job.company.category !== filterCategory) {
        return false;
      }

      // Search filter (title, company name, location)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          job.title,
          job.company.name,
          job.location,
          job.department,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, filterCategory, searchQuery]);

  // Sort: featured first, then alphabetically by company
  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.company.name.localeCompare(b.company.name);
    });
  }, [filteredJobs]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="category-filter"
            className="text-sm text-neutral-600 dark:text-neutral-400"
          >
            Show:
          </label>
          <select
            id="category-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
            className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
          >
            <option value="all">All Companies</option>
            <option value="portfolio">Portfolio</option>
            <option value="network">Network</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
          />
        </div>

        {/* Results count */}
        <span className="text-sm text-neutral-500">
          {sortedJobs.length} {sortedJobs.length === 1 ? "job" : "jobs"}
        </span>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {sortedJobs.length === 0 ? (
          <p className="text-center py-8 text-neutral-500">
            No jobs found matching your criteria.
          </p>
        ) : (
          sortedJobs.map((job) => (
            <a
              key={job.id}
              href={job.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Company Logo */}
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Image
                    src={job.company.logo}
                    alt={job.company.name}
                    width={48}
                    height={48}
                    className="object-contain bg-white rounded-lg p-1 group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Job Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                        {job.title}
                        {job.featured && (
                          <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                            ★
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {job.company.name}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${
                        job.company.category === "portfolio"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {job.company.category === "portfolio" ? "Portfolio" : "Network"}
                    </span>
                  </div>

                  {/* Meta info */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                    <span>{job.location}</span>
                    {job.type && (
                      <span className="capitalize">{job.type.replace("-", " ")}</span>
                    )}
                    {job.department && <span>{job.department}</span>}
                    {job.salary && <span>{job.salary}</span>}
                  </div>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/JobsGrid.tsx
git commit -m "feat(jobs): add JobsGrid component with filtering and search"
```

---

## Task 3: Create Jobs Page

**Files:**
- Create: `src/app/jobs/page.tsx`

**Step 1: Create the page component**

```typescript
import { Navbar } from "@/components/Navbar";
import { JobsGrid } from "@/components/JobsGrid";
import { jobs } from "@/data/jobs";

export const metadata = {
  title: "dcbuilder - Jobs",
  description: "Job opportunities at companies in my network",
};

export default function Jobs() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12 space-y-8">
          {/* Header */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Jobs</h1>
            <p className="max-w-2xl mx-auto text-lg text-neutral-700 dark:text-neutral-300">
              Open positions at companies I&apos;ve invested in, advise, work with, or am
              friends with. These are teams I believe in building products that matter.
            </p>
          </section>

          {/* Jobs Grid */}
          <JobsGrid jobs={jobs} />
        </div>
      </main>
    </>
  );
}
```

**Step 2: Verify the page renders**

Run: `npm run dev`
Navigate to: `http://localhost:3000/jobs`
Expected: Page renders with header and jobs grid

**Step 3: Commit**

```bash
git add src/app/jobs/page.tsx
git commit -m "feat(jobs): add jobs page route"
```

---

## Task 4: Add Jobs Link to Navbar

**Files:**
- Modify: `src/components/Navbar.tsx:7-12`

**Step 1: Add Jobs to navLinks array**

Change:
```typescript
const navLinks = [
	{ href: "/", label: "Home" },
	{ href: "/about", label: "About" },
	{ href: "/blog", label: "Blog" },
	{ href: "/portfolio", label: "Portfolio" },
];
```

To:
```typescript
const navLinks = [
	{ href: "/", label: "Home" },
	{ href: "/about", label: "About" },
	{ href: "/blog", label: "Blog" },
	{ href: "/portfolio", label: "Portfolio" },
	{ href: "/jobs", label: "Jobs" },
];
```

**Step 2: Verify navbar shows Jobs link**

Run: `npm run dev`
Navigate to: `http://localhost:3000`
Expected: Navbar shows "Jobs" link, clicking it navigates to /jobs

**Step 3: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat(jobs): add Jobs link to navbar"
```

---

## Task 5: Populate Initial Jobs Data

**Files:**
- Modify: `src/data/jobs.ts`

**Step 1: Add companies from investments that you want to feature**

This task requires your input on which companies to include and their current job openings. You'll need to:
1. Review investments.ts for company names and logos
2. Decide which companies belong to "portfolio" vs "network"
3. Look up current job openings at each company's careers page
4. Add the job listings to the data file

The structure is already in place from Task 1 - this step is about populating real data.

**Step 2: Verify all jobs render correctly**

Run: `npm run dev`
Navigate to: `http://localhost:3000/jobs`
Expected: All jobs display with correct logos, links work

**Step 3: Commit**

```bash
git add src/data/jobs.ts
git commit -m "feat(jobs): populate initial job listings"
```

---

## Task 6: Build and Verify

**Step 1: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Verify static generation**

Expected output includes:
```
○ /jobs
```

**Step 3: Final commit (if any uncommitted changes)**

```bash
git status
# If changes exist:
git add .
git commit -m "chore: finalize jobs board implementation"
```

---

## Summary

After completing all tasks:
- New `/jobs` route with filterable job listings
- Jobs data in `src/data/jobs.ts` (easy to maintain)
- Category filter (All/Portfolio/Network) + text search
- Consistent styling with existing PortfolioGrid component
- Navbar updated with Jobs link
