import type { AggregatedNewsItem } from '@/lib/news';

export interface CompanyNewsApiCompany {
  title: string;
  slug: string;
  logo: string | null;
  website: string | null;
}

export function buildCompanyNewsApiPayload(
  company: CompanyNewsApiCompany,
  events: AggregatedNewsItem[],
  pagination: { limit: number; offset: number }
) {
  const nextOffset = pagination.offset + pagination.limit;
  return {
    company,
    data: events.slice(pagination.offset, nextOffset),
    meta: {
      total: events.length,
      limit: pagination.limit,
      offset: pagination.offset,
      nextOffset: nextOffset < events.length ? nextOffset : null,
    },
  };
}
