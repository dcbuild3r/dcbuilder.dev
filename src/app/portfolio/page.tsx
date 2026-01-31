import { Navbar } from "@/components/Navbar";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { db, investments as investmentsTable, jobs as jobsTable } from "@/db";
import { desc, asc, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const metadata = {
  title: "Portfolio",
};

// Use ISR with 5 minute revalidation instead of force-dynamic
export const revalidate = 300;

const getInvestments = unstable_cache(
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
    }));
  },
  ["investments"],
  { revalidate: 300, tags: ["investments"] }
);

const getJobCountsByCompany = unstable_cache(
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

export default async function Portfolio() {
  const [investments, jobCounts] = await Promise.all([
    getInvestments(),
    getJobCountsByCompany(),
  ]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto py-8 sm:py-12 space-y-10 sm:space-y-16">
          {/* Disclaimer */}
          <section className="text-center space-y-6">
            <h1 className="text-4xl font-bold">Disclaimer</h1>
            <p className="max-w-3xl mx-auto text-lg text-neutral-700 dark:text-neutral-300">
              All information and opinions presented on this website reflect only my
              personal views and experiences. They are not intended to represent or
              imply the views, policies, or endorsements of any organization, entity,
              or other individuals. The investments, strategies, and opinions expressed
              are solely my own and should not be considered financial advice. Please
              consult a qualified financial advisor before making any investment decisions.
            </p>
          </section>

          {/* Investments */}
          <section className="space-y-8">
            <h2 className="text-4xl font-bold text-center">Investments</h2>
            <PortfolioGrid investments={investments} jobCounts={jobCounts} />
          </section>
        </div>
      </main>
    </>
  );
}
