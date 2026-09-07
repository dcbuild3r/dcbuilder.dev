import { asc, desc, eq, sql } from 'drizzle-orm';
import {
  affiliations,
  announcements,
  blogPosts,
  candidateRedirects,
  candidates,
  curatedLinks,
  db,
  investmentCategories,
  investments,
  jobRoles,
  jobs,
  jobTags,
  newsletterCampaigns,
  newsSourceInvestments,
} from '@/db';
import { isMissingRelationError } from '@/lib/db-schema-compat';
import { isMissingNewsletterSchemaColumnError } from '@/services/newsletter-schema';
import {
  buildPortalPublicSitePayload,
  type PortalPublicSiteRows,
  type PublicSitePayload,
} from '@/lib/portal-public-site';

export async function loadPortalPublicSite(): Promise<PublicSitePayload> {
  const [
    jobRows,
    jobTagRows,
    jobRoleRows,
    candidateRows,
    redirectRows,
    curatedRows,
    announcementRows,
    sourceInvestmentRows,
    investmentRows,
    investmentCategoryRows,
    affiliationRows,
    blogRows,
    campaignRows,
  ] = await Promise.all([
    db
      .select({
        id: jobs.id,
        title: jobs.title,
        company: jobs.company,
        companyLogo: jobs.companyLogo,
        link: jobs.link,
        location: jobs.location,
        remote: jobs.remote,
        type: jobs.type,
        salary: jobs.salary,
        department: jobs.department,
        tags: jobs.tags,
        category: jobs.category,
        featured: jobs.featured,
        description: jobs.description,
        responsibilities: jobs.responsibilities,
        qualifications: jobs.qualifications,
        benefits: jobs.benefits,
        companyWebsite: jobs.companyWebsite,
        companyX: jobs.companyX,
        companyGithub: jobs.companyGithub,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .orderBy(
        sql`${jobs.featured} desc nulls last`,
        desc(jobs.updatedAt),
        asc(jobs.company),
        asc(jobs.title)
      ),
    optionalRows('job_tags', () =>
      db
        .select({
          id: jobTags.id,
          slug: jobTags.slug,
          label: jobTags.label,
          color: jobTags.color,
          createdAt: jobTags.createdAt,
        })
        .from(jobTags)
        .orderBy(asc(jobTags.label))
    ),
    optionalRows('job_roles', () =>
      db
        .select({
          id: jobRoles.id,
          slug: jobRoles.slug,
          label: jobRoles.label,
          createdAt: jobRoles.createdAt,
        })
        .from(jobRoles)
        .orderBy(asc(jobRoles.label))
    ),
    db
      .select({
        id: candidates.id,
        name: candidates.name,
        title: candidates.title,
        location: candidates.location,
        summary: candidates.summary,
        skills: candidates.skills,
        experience: candidates.experience,
        education: candidates.education,
        image: candidates.image,
        cv: candidates.cv,
        featured: candidates.featured,
        available: candidates.available,
        availability: candidates.availability,
        email: candidates.email,
        telegram: candidates.telegram,
        calendly: candidates.calendly,
        x: candidates.x,
        github: candidates.github,
        linkedin: candidates.linkedin,
        website: candidates.website,
        createdAt: candidates.createdAt,
        updatedAt: candidates.updatedAt,
      })
      .from(candidates)
      .orderBy(
        sql`${candidates.featured} desc nulls last`,
        sql`${candidates.available} desc nulls last`,
        desc(candidates.updatedAt),
        asc(candidates.name)
      ),
    optionalRows('candidate_redirects', () =>
      db
        .select({
          oldId: candidateRedirects.oldId,
          newId: candidateRedirects.newId,
          createdAt: candidateRedirects.createdAt,
        })
        .from(candidateRedirects)
        .orderBy(desc(candidateRedirects.createdAt))
    ),
    db
      .select({
        id: curatedLinks.id,
        title: curatedLinks.title,
        url: curatedLinks.url,
        source: curatedLinks.source,
        sourceImage: curatedLinks.sourceImage,
        date: curatedLinks.date,
        description: curatedLinks.description,
        category: curatedLinks.category,
        featured: curatedLinks.featured,
        relevance: curatedLinks.relevance,
        createdAt: curatedLinks.createdAt,
        updatedAt: curatedLinks.updatedAt,
      })
      .from(curatedLinks)
      .orderBy(desc(curatedLinks.date), desc(curatedLinks.relevance), asc(curatedLinks.title)),
    db
      .select({
        id: announcements.id,
        title: announcements.title,
        url: announcements.url,
        company: announcements.company,
        companyLogo: announcements.companyLogo,
        platform: announcements.platform,
        date: announcements.date,
        description: announcements.description,
        category: announcements.category,
        featured: announcements.featured,
        relevance: announcements.relevance,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
      })
      .from(announcements)
      .orderBy(desc(announcements.date), desc(announcements.relevance), asc(announcements.title)),
    optionalRows('news_source_investments', () =>
      db
        .select({
          id: newsSourceInvestments.id,
          sourceType: newsSourceInvestments.sourceType,
          sourceValue: newsSourceInvestments.sourceValue,
          sourceKind: newsSourceInvestments.sourceKind,
          investmentId: newsSourceInvestments.investmentId,
          companyTitle: newsSourceInvestments.companyTitle,
          companyLogo: newsSourceInvestments.companyLogo,
          companyWebsite: newsSourceInvestments.companyWebsite,
          jobCompanies: newsSourceInvestments.jobCompanies,
          createdAt: newsSourceInvestments.createdAt,
          updatedAt: newsSourceInvestments.updatedAt,
        })
        .from(newsSourceInvestments)
        .orderBy(desc(newsSourceInvestments.updatedAt), asc(newsSourceInvestments.sourceValue))
    ),
    db
      .select({
        id: investments.id,
        title: investments.title,
        description: investments.description,
        imageUrl: investments.imageUrl,
        logo: investments.logo,
        tier: investments.tier,
        featured: investments.featured,
        status: investments.status,
        categories: investments.categories,
        website: investments.website,
        x: investments.x,
        github: investments.github,
        createdAt: investments.createdAt,
        updatedAt: investments.updatedAt,
      })
      .from(investments)
      .orderBy(
        sql`case when ${investments.tier} ~ '^[0-9]+$' then ${investments.tier}::int else 999 end`,
        sql`${investments.featured} desc nulls last`,
        asc(investments.title)
      ),
    optionalRows('investment_categories', () =>
      db
        .select({
          id: investmentCategories.id,
          slug: investmentCategories.slug,
          label: investmentCategories.label,
          color: investmentCategories.color,
          createdAt: investmentCategories.createdAt,
        })
        .from(investmentCategories)
        .orderBy(asc(investmentCategories.label))
    ),
    db
      .select({
        id: affiliations.id,
        title: affiliations.title,
        role: affiliations.role,
        dateBegin: affiliations.dateBegin,
        dateEnd: affiliations.dateEnd,
        description: affiliations.description,
        imageUrl: affiliations.imageUrl,
        logo: affiliations.logo,
        website: affiliations.website,
        xHandles: affiliations.xHandles,
        createdAt: affiliations.createdAt,
        updatedAt: affiliations.updatedAt,
      })
      .from(affiliations)
      .orderBy(desc(affiliations.updatedAt), asc(affiliations.title)),
    db
      .select({
        slug: blogPosts.slug,
        title: blogPosts.title,
        description: blogPosts.description,
        content: blogPosts.content,
        date: blogPosts.date,
        source: blogPosts.source,
        sourceUrl: blogPosts.sourceUrl,
        image: blogPosts.image,
        published: blogPosts.published,
        relevance: blogPosts.relevance,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.date), desc(blogPosts.relevance), asc(blogPosts.title)),
    loadNewsletterCampaignRows(),
  ]);

  const rows: PortalPublicSiteRows = {
    jobs: jobRows,
    jobTags: jobTagRows,
    jobRoles: jobRoleRows,
    candidates: candidateRows,
    candidateRedirects: redirectRows,
    curatedLinks: curatedRows,
    announcements: announcementRows,
    newsSourceInvestments: sourceInvestmentRows,
    investments: investmentRows,
    investmentCategories: investmentCategoryRows,
    affiliations: affiliationRows,
    blogPosts: blogRows,
    newsletterCampaigns: campaignRows,
  };

  return buildPortalPublicSitePayload(rows);
}

async function loadNewsletterCampaignRows(): Promise<PortalPublicSiteRows['newsletterCampaigns']> {
  const selectSharedFields = {
    id: newsletterCampaigns.id,
    newsletterType: newsletterCampaigns.newsletterType,
    subject: newsletterCampaigns.subject,
    previewText: newsletterCampaigns.previewText,
    contentMode: newsletterCampaigns.contentMode,
    markdownContent: newsletterCampaigns.markdownContent,
    archiveSubject: newsletterCampaigns.archiveSubject,
    archivePreviewText: newsletterCampaigns.archivePreviewText,
    archiveMarkdownContent: newsletterCampaigns.archiveMarkdownContent,
    status: newsletterCampaigns.status,
    periodDays: newsletterCampaigns.periodDays,
    timeframePreset: newsletterCampaigns.timeframePreset,
    minimumRelevance: newsletterCampaigns.minimumRelevance,
    scheduledAt: newsletterCampaigns.scheduledAt,
    sentAt: newsletterCampaigns.sentAt,
    createdAt: newsletterCampaigns.createdAt,
    updatedAt: newsletterCampaigns.updatedAt,
  };

  try {
    return await db
      .select({ publicSlug: newsletterCampaigns.publicSlug, ...selectSharedFields })
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.status, 'sent'))
      .orderBy(desc(newsletterCampaigns.createdAt));
  } catch (error) {
    if (!isMissingNewsletterSchemaColumnError(error, 'public_slug')) throw error;

    const campaigns = await db
      .select(selectSharedFields)
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.status, 'sent'))
      .orderBy(desc(newsletterCampaigns.createdAt));

    return campaigns.map((campaign) => ({ ...campaign, publicSlug: campaign.id }));
  }
}

async function optionalRows<T>(relationName: string, query: () => Promise<T[]>): Promise<T[]> {
  try {
    return await query();
  } catch (error) {
    if (isMissingRelationError(error, relationName)) {
      console.warn(`[portal-public-site] Optional table ${relationName} is unavailable.`);
      return [];
    }
    throw error;
  }
}
