import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { CompanyNewsIconGrid } from "@/components/CompanyNewsIconGrid";
import { NewsGrid } from "@/components/NewsGrid";
import { NewsTools } from "@/components/NewsTools";
import { getCompanyNewsIconCompanies } from "@/lib/company-news-navigation";
import { getAllNews } from "@/lib/news";

export const metadata = {
  title: "News",
  description:
    "Curated links, blog posts, and announcements from dcbuilder.",
};

// Force dynamic rendering since we need database access
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const allNews = await getAllNews({ includeCompanyTimelineNews: true });
  const companyNewsCompanies = await getCompanyNewsIconCompanies(allNews);

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto py-8 sm:py-10">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">News</h1>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Curated articles, my blog posts, and site announcements.
            </p>
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.75fr)] lg:items-start">
            <NewsTools />
            <CompanyNewsIconGrid companies={companyNewsCompanies} />
          </div>

          {/* News Grid */}
          <Suspense
            fallback={
              <div className="text-center py-8 text-neutral-500">
                Loading news...
              </div>
            }
          >
            <NewsGrid news={allNews} />
          </Suspense>
        </div>
      </main>
    </>
  );
}
