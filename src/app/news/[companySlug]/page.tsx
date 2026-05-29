import Image from "next/image";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { CompanyTimeline } from "@/components/CompanyTimeline";
import { db, investments as investmentsTable } from "@/db";
import { getPortfolioNewsSlug } from "@/lib/portfolio-news";
import { getAllNews } from "@/lib/news";
import { getCompanyTimelineEvents } from "@/lib/company-news";

export const metadata = {
  title: "Company News",
  description:
    "Company-specific announcements and updates from dcbuilder's portfolio.",
};

export const dynamic = "force-dynamic";

interface CompanyNewsPageProps {
  params: Promise<{ companySlug: string }>;
}

async function getCompanyProfile(companySlug: string) {
  const normalizedCompanySlug = companySlug.toLowerCase();
  const investments = await db
    .select({
      title: investmentsTable.title,
      description: investmentsTable.description,
      logo: investmentsTable.logo,
      categories: investmentsTable.categories,
      website: investmentsTable.website,
      x: investmentsTable.x,
      github: investmentsTable.github,
    })
    .from(investmentsTable);
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
    getAllNews(),
    getCompanyProfile(companySlug),
  ]);

  if (!companyProfile) {
    notFound();
  }

  const timelineEvents = getCompanyTimelineEvents(news, companyProfile.title);

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto py-8 sm:py-10">
          <div className="mb-6 grid gap-4 sm:mb-8 sm:grid-cols-[96px_1fr_96px] sm:items-start">
            <div className="flex justify-center sm:justify-start">
              {companyProfile.logo &&
                (companyProfile.website ? (
                  <a
                    href={companyProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${companyProfile.title} website`}
                    className="flex size-20 items-center justify-center rounded-2xl border border-neutral-200 bg-white p-3 transition-transform hover:scale-105 dark:border-neutral-800 dark:bg-neutral-950 sm:size-24"
                  >
                    <Image
                      src={companyProfile.logo}
                      alt={`${companyProfile.title} logo`}
                      width={88}
                      height={88}
                      sizes="(min-width: 640px) 88px, 72px"
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  </a>
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950 sm:size-24">
                    <Image
                      src={companyProfile.logo}
                      alt={`${companyProfile.title} logo`}
                      width={88}
                      height={88}
                      sizes="(min-width: 640px) 88px, 72px"
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  </div>
                ))}
            </div>
            <div className="text-center">
              <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
                {companyProfile.title} News
              </h1>
              <p className="mx-auto max-w-2xl text-neutral-600 dark:text-neutral-400">
                Company-specific announcements, X posts, and blog updates from the
                portfolio.
              </p>
            </div>
            <div aria-hidden="true" />
          </div>

          <CompanyTimeline
            companyName={companyProfile.title}
            events={timelineEvents}
            company={companyProfile}
          />
        </div>
      </main>
    </>
  );
}
