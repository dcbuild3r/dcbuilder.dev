import { PortfolioGrid } from "@/components/PortfolioGrid";
import { getInvestments, getJobCountsByCompany, getInvestmentCategories } from "@/lib/portfolio-data";
import { filterNewsByCompany } from "@/lib/company-news";
import { getPublicAllNews } from "@/lib/news";
import { withDataFallback } from "@/lib/resilient-data";
import { PageHeader } from "@/components/ui/PageHeader";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Portfolio",
  description: "Angel investments in cryptography, infrastructure, and AI.",
  path: "/portfolio",
});

// Force runtime rendering since this page reads directly from Postgres.
export const dynamic = "force-dynamic";

export default async function Portfolio() {
  const [investments, jobCounts, categories, news] = await Promise.all([
    withDataFallback("portfolio.investments", getInvestments(), null, { timeoutMs: 10_000 }),
    withDataFallback("portfolio.job-counts", getJobCountsByCompany(), {}),
    withDataFallback("portfolio.categories", getInvestmentCategories(), []),
    withDataFallback("portfolio.news", getPublicAllNews({ includeCompanyTimelineNews: true }), []),
  ]);
  const newsCounts = Object.fromEntries(
    (investments ?? []).map((investment) => [
      investment.title,
      filterNewsByCompany(news, investment.title).length,
    ])
  );

  const stats = investments && [
    { label: "Investments", value: investments.length },
    { label: "Featured", value: investments.filter((i) => i.featured).length },
    { label: "Categories", value: categories.length },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-[72px] pb-24">
      <PageHeader
        eyebrow="Angel investing"
        title="Portfolio"
        lede={
          <>
            Supporting teams building in programmable cryptography, distributed systems, digital identity, AI, scalability and privacy.
            <span className="group relative mt-4 block w-fit">
              <button
                type="button"
                aria-describedby="pf-disclaimer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 text-[13.5px] font-medium text-body"
              >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
                Disclaimer
              </button>
              <span
                id="pf-disclaimer"
                role="tooltip"
                className="absolute left-0 top-[52px] z-10 hidden w-[min(460px,86vw)] rounded-[14px] border border-line bg-surface p-4 text-[13px] leading-[1.65] text-body shadow-xl group-focus-within:block group-hover:block"
              >
                All information and opinions presented on this website reflect only my personal views and experiences. They are not intended to represent or imply the views, policies, or endorsements of any organization, entity, or other individuals. The investments, strategies, and opinions expressed are solely my own and should not be considered financial advice. Please consult a qualified financial advisor before making any investment decisions.
              </span>
            </span>
          </>
        }
        aside={
          stats && <dl className="flex gap-10">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-muted">{s.label}</dt>
                <dd className="mt-2 text-[40px] font-semibold leading-none tracking-[-0.05em] text-ink">{s.value}</dd>
              </div>
            ))}
          </dl>
        }
      />

      <h2 className="sr-only">Investments</h2>
      {investments === null ? (
        <div role="alert" className="text-center text-muted">
          <p>Investments are temporarily unavailable.</p>
          <a href="/portfolio" className="mt-3 inline-block text-accent underline">Try again</a>
        </div>
      ) : (
        <PortfolioGrid
          investments={investments}
          jobCounts={jobCounts}
          newsCounts={newsCounts}
          categories={categories}
        />
      )}
    </div>
  );
}
