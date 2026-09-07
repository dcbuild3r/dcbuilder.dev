import { db, investments as investmentsTable } from '@/db';
import { filterNewsByCompany } from '@/lib/company-news';
import type { AggregatedNewsItem } from '@/lib/news';
import { getPortfolioNewsUrl } from '@/lib/portfolio-news';
import { cachePublicData } from '@/lib/public-cache';
import { asc, desc } from 'drizzle-orm';

export interface CompanyNewsIconCompany {
  name: string;
  logo: string;
  href: string;
  newsCount: number;
}

type CompanyNewsInvestment = {
  title: string;
  logo: string | null;
  status: string | null;
};

const getPublicCompanyNewsInvestments = cachePublicData(
  ["company-news-investments"],
  async (): Promise<CompanyNewsInvestment[]> =>
    db
      .select({
        title: investmentsTable.title,
        logo: investmentsTable.logo,
        status: investmentsTable.status,
      })
      .from(investmentsTable)
      .orderBy(
        asc(investmentsTable.tier),
        desc(investmentsTable.featured),
        asc(investmentsTable.title)
      ),
  ["investments", "news"],
);

export async function getCompanyNewsIconCompanies(
  news: AggregatedNewsItem[]
): Promise<CompanyNewsIconCompany[]> {
  const investments = await getPublicCompanyNewsInvestments();

  return investments
    .map((investment) => {
      const logo = investment.logo?.trim();
      const newsCount = filterNewsByCompany(news, investment.title).length;
      const isDefunct = investment.status === 'defunct';

      if (!logo || isDefunct || newsCount === 0) return null;

      return {
        name: investment.title,
        logo,
        href: getPortfolioNewsUrl(investment.title),
        newsCount,
      };
    })
    .filter((company): company is CompanyNewsIconCompany => Boolean(company));
}
