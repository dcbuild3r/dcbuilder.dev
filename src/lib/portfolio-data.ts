import { db, investments as investmentsTable, jobs as jobsTable, investmentCategories as categoriesTable, candidates as candidatesTable } from "@/db";
import { desc, asc, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const getInvestments = unstable_cache(
  async () => {
    const data = await db
      .select()
      .from(investmentsTable)
      .orderBy(asc(investmentsTable.tier), desc(investmentsTable.featured));

    // Map to expected format with tier as number
    return data.map(inv => ({
      ...inv,
      tier: (parseInt(inv.tier || "2") || 2) as 1 | 2 | 3 | 4,
      featured: inv.featured ?? false,
      categories: inv.categories ?? [],
    }));
  },
  ["investments"],
  { revalidate: 300, tags: ["investments"] }
);

export const getJobCountsByCompany = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const results = await db
      .select({
        company: jobsTable.company,
        count: sql<number>`count(*)::int`,
      })
      .from(jobsTable)
      .groupBy(jobsTable.company);

    return Object.fromEntries(results.map(r => [r.company, r.count]));
  },
  ["job-counts-by-company"],
  { revalidate: 300, tags: ["jobs"] }
);

export const getInvestmentCategories = unstable_cache(
  async () => {
    return db.select().from(categoriesTable).orderBy(asc(categoriesTable.label));
  },
  ["investment-categories"],
  { revalidate: 300, tags: ["investment-categories"] }
);

export const getCandidateCount = unstable_cache(
  async () => {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(candidatesTable);
    return row.count;
  },
  ["candidate-count"],
  { revalidate: 300, tags: ["candidates"] }
);
