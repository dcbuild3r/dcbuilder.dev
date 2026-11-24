import Image from "next/image";
import { notFound } from "next/navigation";
import { CompanyNewsIconGrid } from "@/components/CompanyNewsIconGrid";
import { PageHeader } from "@/components/ui/PageHeader";
import { CompanyTimeline } from "@/components/CompanyTimeline";
import { db, investments as investmentsTable } from "@/db";
import { getPortfolioNewsSlug } from "@/lib/portfolio-news";
import { getPublicAllNews } from "@/lib/news";
import { cachePublicData } from "@/lib/public-cache";
import { withDataFallback } from "@/lib/resilient-data";
import { getCompanyTimelineEvents } from "@/lib/company-news";
import { getCompanyNewsIconCompanies } from "@/lib/company-news-navigation";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;
  const company = await withDataFallback("company-news.metadata", getCompanyProfile(companySlug), null);
  return pageMetadata({
    title: company ? `${company.title} News` : "Company News",
    description: company
      ? `Announcements and updates from ${company.title}, a dcbuilder portfolio company.`
      : "Company-specific announcements and updates from dcbuilder's portfolio.",
    path: `/news/${companySlug.toLowerCase()}`,
  });
}

export const dynamic = "force-dynamic";

interface CompanyNewsPageProps {
  params: Promise<{ companySlug: string }>;
}

const getPublicCompanyProfiles = cachePublicData(
  ["company-news-profiles"],
  async () => db
    .select({
      title: investmentsTable.title,
      description: investmentsTable.description,
      logo: investmentsTable.logo,
      categories: investmentsTable.categories,
      website: investmentsTable.website,
      x: investmentsTable.x,
      github: investmentsTable.github,
    })
    .from(investmentsTable),
  ["investments", "news"],
);

async function getCompanyProfile(companySlug: string) {
  const normalizedCompanySlug = companySlug.toLowerCase();
  const investments = await getPublicCompanyProfiles();
  const investment = investments.find(
    (item) => getPortfolioNewsSlug(item.title) === normalizedCompanySlug
  );

  if (!investment) return null;

  return {
    ...investment,
    categories: investment.categories ?? [],
  };
}

export default async function CompanyNewsPage({
  params,
}: CompanyNewsPageProps) {
  const { companySlug } = await params;
  const [news, companyProfile] = await Promise.all([
    withDataFallback("company-news.items", getPublicAllNews({ includeCompanyTimelineNews: true }), []),
    withDataFallback("company-news.profile", getCompanyProfile(companySlug), null),
  ]);

  if (!companyProfile) {
    notFound();
  }

  const timelineEvents = getCompanyTimelineEvents(news, companyProfile.title);
  const companyNewsCompanies = await withDataFallback("company-news.companies", getCompanyNewsIconCompanies(news), []);

  const logo = companyProfile.logo ? (
    <Image
      src={companyProfile.logo}
      alt={`${companyProfile.title} logo`}
      width={88}
      height={88}
      sizes="(min-width: 640px) 88px, 72px"
      className="h-full w-full object-contain"
      unoptimized
    />
  ) : null;

  return (
    <div className="mx-auto max-w-[1200px] px-6 pt-[72px] pb-24">
      <PageHeader
        eyebrow="Portfolio news"
        title={`${companyProfile.title} News`}
        lede="Company-specific announcements, X posts, and blog updates from the portfolio."
        aside={
          logo &&
          (companyProfile.website ? (
            <a
              href={companyProfile.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${companyProfile.title} website`}
              className="flex size-20 items-center justify-center rounded-2xl border border-line bg-surface p-3 sm:size-24"
            >
              {logo}
            </a>
          ) : (
            <div className="flex size-20 items-center justify-center rounded-2xl border border-line bg-surface p-3 sm:size-24">
              {logo}
            </div>
          ))
        }
      />

      <div className="mb-8">
        <CompanyNewsIconGrid
          activeCompanyName={companyProfile.title}
          companies={companyNewsCompanies}
          variant="compact"
        />
      </div>

      <CompanyTimeline
        companyName={companyProfile.title}
        events={timelineEvents}
        company={companyProfile}
      />
    </div>
  );
}
