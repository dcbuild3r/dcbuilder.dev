import { Suspense } from "react";
import { CompanyNewsIconGrid } from "@/components/CompanyNewsIconGrid";
import { NewsGrid } from "@/components/NewsGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { NewsTools } from "@/components/NewsTools";
import { getCompanyNewsIconCompanies } from "@/lib/company-news-navigation";
import { getPublicAllNews } from "@/lib/news";
import { withDataFallback } from "@/lib/resilient-data";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "News",
  description: "Curated links, blog posts, and announcements from dcbuilder.",
  path: "/news",
});

// Force dynamic rendering since we need database access
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const allNews = await withDataFallback("news.items", getPublicAllNews({ includeCompanyTimelineNews: true }), []);
  const companyNewsCompanies = allNews.length
    ? await withDataFallback("news.companies", getCompanyNewsIconCompanies(allNews), [])
    : [];

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-8 pb-20">
      <PageHeader
        eyebrow="Updated daily"
        title="News"
        lede="Curated articles, my blog posts, and site announcements."
      />

      <CompanyNewsIconGrid companies={companyNewsCompanies} />

      <div className="mt-8">
        <Suspense
          fallback={
            <div className="py-8 text-center text-muted">Loading news...</div>
          }
        >
          <NewsGrid news={allNews} />
        </Suspense>
      </div>

      <NewsTools />
    </div>
  );
}
