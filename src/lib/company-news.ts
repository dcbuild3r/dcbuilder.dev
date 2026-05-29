import { AggregatedNewsItem } from "@/lib/news";
import { compareNewsByDateAndRelevance } from "@/lib/news-sorting";

export function normalizeCompanyFilterValue(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function newsItemMatchesCompany(
  item: AggregatedNewsItem,
  companyName: string
) {
  const companyKey = normalizeCompanyFilterValue(companyName);
  if (!companyKey) return false;

  const candidateCompanies = [
    item.portfolioCompany?.title,
    item.company,
    ...(item.source?.split(",") ?? []),
  ];

  return candidateCompanies.some(
    (company) =>
      company && normalizeCompanyFilterValue(company) === companyKey
  );
}

export function filterNewsByCompany(
  news: AggregatedNewsItem[],
  companyName: string
) {
  return news.filter((item) => newsItemMatchesCompany(item, companyName));
}

export function getCompanyTimelineEvents(
  news: AggregatedNewsItem[],
  companyName: string,
  limit?: number
) {
  const sortedEvents = [...filterNewsByCompany(news, companyName)].sort((a, b) =>
    compareNewsByDateAndRelevance(a, b, "desc")
  );

  if (!limit || !Number.isFinite(limit)) {
    return sortedEvents;
  }

  return sortedEvents.slice(0, limit);
}
