import { db, investments as investmentsTable } from '@/db';
import { buildCompanyNewsApiPayload } from '@/lib/company-news-api';
import { getCompanyTimelineEvents } from '@/lib/company-news';
import { getAllNews } from '@/lib/news';
import { getPortfolioNewsSlug } from '@/lib/portfolio-news';
import { parsePaginationParams } from '@/services/auth';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  const { companySlug } = await params;
  const normalizedSlug = companySlug.trim().toLowerCase();
  const { limit, offset } = parsePaginationParams(request.nextUrl.searchParams, {
    limit: 100,
    maxLimit: 200,
  });

  try {
    const [news, investments] = await Promise.all([
      getAllNews({ includeCompanyTimelineNews: true }),
      db
        .select({
          title: investmentsTable.title,
          logo: investmentsTable.logo,
          website: investmentsTable.website,
        })
        .from(investmentsTable),
    ]);
    const investment = investments.find(
      (candidate) => getPortfolioNewsSlug(candidate.title) === normalizedSlug
    );
    if (!investment) {
      return Response.json(
        { error: 'Portfolio company not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const payload = buildCompanyNewsApiPayload(
      {
        title: investment.title,
        slug: getPortfolioNewsSlug(investment.title),
        logo: investment.logo,
        website: investment.website,
      },
      getCompanyTimelineEvents(news, investment.title),
      { limit, offset }
    );
    return Response.json(payload, {
      headers: { 'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('[api/news/company] GET failed:', error);
    return Response.json(
      { error: 'Failed to fetch company news', code: 'DB_QUERY_ERROR' },
      { status: 500 }
    );
  }
}
