const HIRING_ENTITIES: Record<string, string[]> = {
  Monad: ["Monad Foundation", "Category Labs"],
};

type PortfolioJobInvestment = {
  title: string;
  featured?: boolean | null;
};

export function getPortfolioJobCompanies(companyTitle: string): string[] {
  return HIRING_ENTITIES[companyTitle] || [companyTitle];
}

export function getFeaturedPortfolioJobCompanies(
  investments: PortfolioJobInvestment[]
): Set<string> {
  const companies = new Set<string>();

  investments.forEach((investment) => {
    if (!investment.featured) return;

    getPortfolioJobCompanies(investment.title).forEach((company) => {
      companies.add(company);
    });
  });

  return companies;
}

export function getPortfolioJobCount(
  companyTitle: string,
  jobCounts: Record<string, number>
): number {
  return getPortfolioJobCompanies(companyTitle).reduce(
    (sum, entity) => sum + (jobCounts[entity] || 0),
    0
  );
}

export function getPortfolioJobsUrl(companyTitle: string): string {
  const params = getPortfolioJobCompanies(companyTitle)
    .map((entity) => `company=${encodeURIComponent(entity)}`)
    .join("&");
  return `/jobs?${params}`;
}
