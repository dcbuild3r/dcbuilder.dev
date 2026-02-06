import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { NewsGrid } from "@/components/NewsGrid";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { getAllNews } from "@/lib/news";

export const metadata = {
  title: "News",
  description:
    "Curated links, blog posts, and announcements from dcbuilder's portfolio companies.",
};

// Force dynamic rendering since we need database access
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await getAllNews();

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">News</h1>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Curated articles, my blog posts, and announcements from portfolio
              companies.
            </p>
          </div>

          <div className="mb-8 sm:mb-10">
            <NewsletterSignup />
          </div>

          {/* News Grid */}
          <Suspense
            fallback={
              <div className="text-center py-8 text-neutral-500">
                Loading news...
              </div>
            }
          >
            <NewsGrid news={news} />
          </Suspense>
        </div>
      </main>
    </>
  );
}
