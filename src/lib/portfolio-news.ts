import { normalizeCompanyFilterValue } from "@/lib/company-news";

export function getPortfolioNewsSlug(companyTitle: string): string {
  return normalizeCompanyFilterValue(companyTitle)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getPortfolioNewsUrl(companyTitle: string): string {
  return `/news/${getPortfolioNewsSlug(companyTitle)}`;
}
