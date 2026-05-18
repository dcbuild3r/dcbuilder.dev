const HIRING_ENTITIES: Record<string, string[]> = {
  Monad: ["Monad Foundation", "Category Labs"],
};

export function getPortfolioJobCompanies(companyTitle: string): string[] {
  return HIRING_ENTITIES[companyTitle] || [companyTitle];
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
