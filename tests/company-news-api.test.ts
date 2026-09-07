import { describe, expect, test } from 'bun:test';
import { buildCompanyNewsApiPayload } from '../src/lib/company-news-api';

describe('company news API payload', () => {
  test('returns the complete company timeline through stable pagination', () => {
    const events = Array.from({ length: 5 }, (_, index) => ({
      id: `lighter-${index + 1}`,
      type: 'curated' as const,
      title: `Lighter update ${index + 1}`,
      url: `https://x.com/Lighter_xyz/status/${index + 1}`,
      date: `2026-08-${25 - index}`,
      postedAt: `2026-08-${25 - index}T00:00:00.000Z`,
      category: 'general' as const,
      relevance: 5,
      portfolioCompany: {
        title: 'Lighter',
        logo: 'https://example.com/lighter.png',
        website: 'https://lighter.xyz',
        jobsUrl: '/jobs?company=Lighter',
        jobCount: 0,
        sourceIsCompanyAccount: true,
      },
    }));

    expect(
      buildCompanyNewsApiPayload(
        { title: 'Lighter', slug: 'lighter', logo: '/lighter.png', website: 'https://lighter.xyz' },
        events,
        { limit: 2, offset: 2 }
      )
    ).toEqual({
      company: {
        title: 'Lighter',
        slug: 'lighter',
        logo: '/lighter.png',
        website: 'https://lighter.xyz',
      },
      data: events.slice(2, 4),
      meta: { total: 5, limit: 2, offset: 2, nextOffset: 4 },
    });
  });
});
