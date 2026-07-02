import { db, investments as investmentsTable } from '@/db';
import { filterNewsByCompany } from '@/lib/company-news';
import type { AggregatedNewsItem } from '@/lib/news';
import { getPortfolioNewsUrl } from '@/lib/portfolio-news';
import { asc, desc } from 'drizzle-orm';

export interface CompanyNewsIconCompany {
  name: string;
  logo: string;
  href: string;
  newsCount: number;
}

export async function getCompanyNewsIconCompanies(
  news: AggregatedNewsItem[]
): Promise<CompanyNewsIconCompany[]> {
  const investments = await db
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
    );

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
