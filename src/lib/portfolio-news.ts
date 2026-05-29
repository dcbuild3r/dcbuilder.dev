export function getPortfolioNewsSlug(companyTitle: string): string {
  return companyTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getPortfolioNewsUrl(companyTitle: string): string {
  return `/news/${getPortfolioNewsSlug(companyTitle)}`;
}
