import { afterEach, describe, expect, mock, test } from 'bun:test';
import {
  buildPortalPublicSitePayload,
  type PortalPublicSiteRows,
} from '../src/lib/portal-public-site';

const oldDate = '2026-01-01T00:00:00.000Z';
const newDate = '2026-07-20T00:00:00.000Z';

describe('Portal public site export projection', () => {
  test('returns only approved fields, published posts, and sent newsletter archives', () => {
    const rows = fixtureRows();
    rows.blogPosts.push({
      ...rows.blogPosts[0],
      slug: 'private-draft',
      title: 'Private draft marker',
      published: false,
    });
    rows.newsletterCampaigns.push({
      ...rows.newsletterCampaigns[0],
      id: 'draft-campaign',
      publicSlug: 'draft-campaign',
      subject: 'Private campaign marker',
      status: 'draft',
    });

    const payload = buildPortalPublicSitePayload(rows, new Date(newDate));
    const serialized = JSON.stringify(payload);

    expect(payload.fetchedAt).toBe(newDate);
    expect(payload.blogPosts.map((post) => post.slug)).toEqual(['published-post']);
    expect(payload.newsletterCampaigns.map((campaign) => campaign.id)).toEqual(['sent-campaign']);
    expect(Object.keys(payload.jobs[0]).sort()).toEqual(
      [
        'benefits',
        'category',
        'company',
        'companyGithub',
        'companyLogo',
        'companyWebsite',
        'companyX',
        'createdAt',
        'department',
        'description',
        'featured',
        'id',
        'link',
        'location',
        'qualifications',
        'remote',
        'responsibilities',
        'salary',
        'tags',
        'title',
        'type',
        'updatedAt',
      ].sort()
    );
    expect(serialized).not.toContain('Private draft marker');
    expect(serialized).not.toContain('Private campaign marker');
    expect(serialized).not.toContain('databaseCredentialMarker');
    expect(serialized).not.toContain('subscriberMarker');
    expect(serialized).not.toContain('renderedHtmlMarker');
  });

  test('applies stable ordering and derives investment counts from exported rows', () => {
    const rows = fixtureRows();
    rows.jobs.unshift({
      ...rows.jobs[0],
      id: 'older-unfeatured-job',
      title: 'Older role',
      featured: false,
      updatedAt: oldDate,
    });
    rows.curatedLinks.push({
      ...rows.curatedLinks[0],
      id: 'older-news',
      title: 'Older news',
      date: oldDate,
      relevance: 10,
    });

    const payload = buildPortalPublicSitePayload(rows, new Date(newDate));

    expect(payload.jobs.map((job) => job.id)).toEqual(['featured-job', 'older-unfeatured-job']);
    expect(payload.news.map((item) => item.id)).toEqual(['announcement', 'curated', 'older-news']);
    expect(payload.investments[0]).toMatchObject({
      title: 'Example Co',
      jobCount: 2,
      newsCount: 1,
    });
  });
});

describe('GET /api/v1/portal/public-site', () => {
  afterEach(() => {
    mock.restore();
  });

  test('requires portal:read and wraps the export in a data envelope', async () => {
    const permissions: Array<string | undefined> = [];
    const payload = buildPortalPublicSitePayload(fixtureRows(), new Date(newDate));
    const loadPortalPublicSite = mock(async () => payload);

    mock.module('@/services/auth', () => ({
      requireAuth: async (request: Request, permission?: string) => {
        permissions.push(permission);
        if (!request.headers.get('authorization')) {
          return Response.json({ error: 'Missing API key' }, { status: 401 });
        }
        return {
          valid: true as const,
          keyId: 'portal-key',
          name: 'Portal',
          permissions: ['portal:read'],
        };
      },
    }));
    mock.module('@/services/portal-public-site', () => ({ loadPortalPublicSite }));

    const { GET } = await import(`../src/app/api/v1/portal/public-site/route?test=${Date.now()}`);

    const unauthorized = await GET(
      new Request('https://dcbuilder.dev/api/v1/portal/public-site') as never
    );
    expect(unauthorized.status).toBe(401);
    expect(loadPortalPublicSite).not.toHaveBeenCalled();

    const response = await GET(
      new Request('https://dcbuilder.dev/api/v1/portal/public-site', {
        headers: { authorization: 'Bearer server-only-token' },
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(permissions).toEqual(['portal:read', 'portal:read']);
    expect(body).toEqual({ data: payload });
    expect(loadPortalPublicSite).toHaveBeenCalledTimes(1);
  });
});

function fixtureRows(): PortalPublicSiteRows {
  return {
    jobs: [
      {
        id: 'featured-job',
        title: 'Engineer',
        company: 'Example Co',
        companyLogo: null,
        link: 'https://example.com/jobs/engineer',
        location: 'Prague',
        remote: 'Remote',
        type: 'Full-time',
        salary: null,
        department: 'Engineering',
        tags: ['typescript'],
        category: 'portfolio',
        featured: true,
        description: 'Build things',
        responsibilities: ['Ship'],
        qualifications: ['Care'],
        benefits: null,
        companyWebsite: 'https://example.com',
        companyX: null,
        companyGithub: null,
        createdAt: oldDate,
        updatedAt: newDate,
        databaseCredential: 'databaseCredentialMarker',
      } as PortalPublicSiteRows['jobs'][number],
    ],
    jobTags: [
      { id: 'tag', slug: 'typescript', label: 'TypeScript', color: null, createdAt: oldDate },
    ],
    jobRoles: [{ id: 'role', slug: 'engineering', label: 'Engineering', createdAt: oldDate }],
    candidates: [
      {
        id: 'candidate',
        name: 'Candidate',
        title: 'Engineer',
        location: 'Prague',
        summary: 'Public profile',
        skills: ['TypeScript'],
        experience: null,
        education: null,
        image: null,
        cv: null,
        featured: true,
        available: true,
        availability: 'looking',
        email: 'public@example.com',
        telegram: null,
        calendly: null,
        x: null,
        github: null,
        linkedin: null,
        website: null,
        createdAt: oldDate,
        updatedAt: newDate,
        subscriberEmail: 'subscriberMarker',
      } as PortalPublicSiteRows['candidates'][number],
    ],
    candidateRedirects: [{ oldId: 'old', newId: 'candidate', createdAt: oldDate }],
    curatedLinks: [
      {
        id: 'curated',
        title: 'Curated story',
        url: 'https://example.com/story',
        source: 'Example',
        sourceImage: null,
        date: newDate,
        description: 'Story',
        category: 'engineering',
        featured: false,
        relevance: 5,
        createdAt: oldDate,
        updatedAt: newDate,
      },
    ],
    announcements: [
      {
        id: 'announcement',
        title: 'Announcement',
        url: 'https://example.com/announcement',
        company: 'Example Co',
        companyLogo: null,
        platform: 'blog',
        date: newDate,
        description: 'Announcement',
        category: 'portfolio',
        featured: true,
        relevance: 8,
        createdAt: oldDate,
        updatedAt: newDate,
      },
    ],
    newsSourceInvestments: [
      {
        id: 'mapping',
        sourceType: 'blog_host',
        sourceValue: 'example.com',
        sourceKind: 'company',
        investmentId: 'investment',
        companyTitle: 'Example Co',
        companyLogo: null,
        companyWebsite: 'https://example.com',
        jobCompanies: ['Example Co'],
        createdAt: oldDate,
        updatedAt: newDate,
      },
    ],
    investments: [
      {
        id: 'investment',
        title: 'Example Co',
        description: 'Example investment',
        imageUrl: null,
        logo: null,
        tier: '1',
        featured: true,
        status: 'active',
        categories: ['AI'],
        website: 'https://example.com',
        x: null,
        github: null,
        createdAt: oldDate,
        updatedAt: newDate,
      },
    ],
    investmentCategories: [{ id: 'ai', slug: 'ai', label: 'AI', color: null, createdAt: oldDate }],
    affiliations: [
      {
        id: 'affiliation',
        title: 'Example',
        role: 'Contributor',
        dateBegin: '2026',
        dateEnd: null,
        description: null,
        imageUrl: null,
        logo: null,
        website: 'https://example.com',
        xHandles: null,
        createdAt: oldDate,
        updatedAt: newDate,
      },
    ],
    blogPosts: [
      {
        slug: 'published-post',
        title: 'Published post',
        description: 'Post',
        content: 'Public post body',
        date: newDate,
        source: null,
        sourceUrl: null,
        image: null,
        published: true,
        relevance: 7,
        createdAt: oldDate,
        updatedAt: newDate,
      },
    ],
    newsletterCampaigns: [
      {
        id: 'sent-campaign',
        publicSlug: 'sent-campaign',
        newsletterType: 'news',
        subject: 'Sent campaign',
        previewText: 'Preview',
        contentMode: 'markdown',
        markdownContent: 'Sent markdown body',
        archiveSubject: 'Archive subject',
        archivePreviewText: 'Archive preview',
        archiveMarkdownContent: 'Sent archive body',
        status: 'sent',
        periodDays: 7,
        timeframePreset: 'weekly',
        minimumRelevance: 1,
        scheduledAt: oldDate,
        sentAt: newDate,
        createdAt: oldDate,
        updatedAt: newDate,
        renderedHtml: 'renderedHtmlMarker',
      } as PortalPublicSiteRows['newsletterCampaigns'][number],
    ],
  };
}
