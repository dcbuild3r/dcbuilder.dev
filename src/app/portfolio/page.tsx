import { Navbar } from "@/components/Navbar";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { investments } from "@/data/investments";

export const metadata = {
  title: "dcbuilder - Portfolio",
};

export default function Portfolio() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 px-6">
        <div className="max-w-6xl mx-auto py-12 space-y-16">
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
            <PortfolioGrid investments={investments} />
          </section>
        </div>
      </main>
    </>
  );
}
