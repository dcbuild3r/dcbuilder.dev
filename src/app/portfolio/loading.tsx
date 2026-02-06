import { Navbar } from "@/components/Navbar";
import { PortfolioFiltersStatic, InvestmentCardSkeleton } from "@/components/skeletons";
import { PORTFOLIO_PAGE } from "@/data/page-content";

export default function PortfolioLoading() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto py-8 sm:py-12 space-y-10 sm:space-y-16">
          {/* Disclaimer - Static content */}
          <section className="text-center space-y-6">
            <h1 className="text-4xl font-bold">{PORTFOLIO_PAGE.disclaimer.title}</h1>
            <p className="max-w-3xl mx-auto text-lg text-neutral-700 dark:text-neutral-300">
              {PORTFOLIO_PAGE.disclaimer.text}
            </p>
          </section>

          {/* Investments */}
          <section className="space-y-8">
            <h2 className="text-4xl font-bold text-center">{PORTFOLIO_PAGE.investments.title}</h2>
            <div className="space-y-6" data-testid="portfolio-grid">
              {/* Static filters - render immediately */}
              <PortfolioFiltersStatic />

              {/* Investments grid - skeleton for dynamic data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <InvestmentCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
