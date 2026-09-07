type DateValue = Date | string;

interface TimestampedRow {
  createdAt: DateValue;
  updatedAt: DateValue;
}

export interface PortalPublicJobRow extends TimestampedRow {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  link: string;
  location: string | null;
  remote: string | null;
  type: string | null;
  salary: string | null;
  department: string | null;
  tags: string[] | null;
  category: string;
  featured: boolean | null;
  description: string | null;
  responsibilities: string[] | null;
  qualifications: string[] | null;
  benefits: string[] | null;
  companyWebsite: string | null;
  companyX: string | null;
  companyGithub: string | null;
}

export interface PortalPublicCandidateRow extends TimestampedRow {
  id: string;
  name: string;
  title: string | null;
  location: string | null;
  summary: string | null;
  skills: string[] | null;
  experience: string | null;
  education: string | null;
  image: string | null;
  cv: string | null;
  featured: boolean | null;
  available: boolean | null;
  availability: string | null;
  email: string | null;
  telegram: string | null;
  calendly: string | null;
  x: string | null;
  github: string | null;
  linkedin: string | null;
  website: string | null;
}

export interface PortalPublicCuratedLinkRow extends TimestampedRow {
  id: string;
  title: string;
  url: string;
  source: string;
  sourceImage: string | null;
  date: DateValue;
  description: string | null;
  category: string;
  featured: boolean | null;
  relevance: number;
}

export interface PortalPublicAnnouncementRow extends TimestampedRow {
  id: string;
  title: string;
  url: string;
  company: string;
  companyLogo: string | null;
  platform: string;
  date: DateValue;
  description: string | null;
  category: string;
  featured: boolean | null;
  relevance: number;
}

export interface PortalPublicInvestmentRow extends TimestampedRow {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  logo: string | null;
  tier: string | null;
  featured: boolean | null;
  status: string | null;
  categories: string[] | null;
  website: string | null;
  x: string | null;
  github: string | null;
}

export interface PortalPublicAffiliationRow extends TimestampedRow {
  id: string;
  title: string;
  role: string;
  dateBegin: string | null;
  dateEnd: string | null;
  description: string | null;
  imageUrl: string | null;
  logo: string | null;
  website: string | null;
  xHandles: string[] | null;
}

export interface PortalPublicBlogPostRow extends TimestampedRow {
  slug: string;
  title: string;
  description: string | null;
  content: string;
  date: DateValue;
  source: string | null;
  sourceUrl: string | null;
  image: string | null;
  published: boolean | null;
  relevance: number;
}

export interface PortalPublicNewsletterCampaignRow extends TimestampedRow {
  id: string;
  publicSlug: string;
  newsletterType: string;
  subject: string;
  previewText: string | null;
  contentMode: string;
  markdownContent: string | null;
  archiveSubject: string | null;
  archivePreviewText: string | null;
  archiveMarkdownContent: string | null;
  status: string;
  periodDays: number;
  timeframePreset: string;
  minimumRelevance: number;
  scheduledAt: DateValue | null;
  sentAt: DateValue | null;
}

export interface PortalPublicSiteRows {
  jobs: PortalPublicJobRow[];
  jobTags: Array<{
    id: string;
    slug: string;
    label: string;
    color: string | null;
    createdAt: DateValue;
  }>;
  jobRoles: Array<{ id: string; slug: string; label: string; createdAt: DateValue }>;
  candidates: PortalPublicCandidateRow[];
  candidateRedirects: Array<{ oldId: string; newId: string; createdAt: DateValue }>;
  curatedLinks: PortalPublicCuratedLinkRow[];
  announcements: PortalPublicAnnouncementRow[];
  newsSourceInvestments: Array<{
    id: string;
    sourceType: string;
    sourceValue: string;
    sourceKind: string;
    investmentId: string | null;
    companyTitle: string | null;
    companyLogo: string | null;
    companyWebsite: string | null;
    jobCompanies: string[] | null;
    createdAt: DateValue;
    updatedAt: DateValue;
  }>;
  investments: PortalPublicInvestmentRow[];
  investmentCategories: Array<{
    id: string;
    slug: string;
    label: string;
    color: string | null;
    createdAt: DateValue;
  }>;
  affiliations: PortalPublicAffiliationRow[];
  blogPosts: PortalPublicBlogPostRow[];
  newsletterCampaigns: PortalPublicNewsletterCampaignRow[];
}

export interface PublicSitePayload {
  source: 'dcbuilder.dev';
  fetchedAt: string;
  baseUrl: 'https://dcbuilder.dev';
  pages: typeof PUBLIC_PAGE_COPY;
  jobs: ReturnType<typeof mapJob>[];
  jobTags: ReturnType<typeof mapJobTag>[];
  jobRoles: ReturnType<typeof mapJobRole>[];
  candidates: ReturnType<typeof mapCandidate>[];
  candidateRedirects: ReturnType<typeof mapCandidateRedirect>[];
  news: Array<ReturnType<typeof mapCuratedLink> | ReturnType<typeof mapAnnouncement>>;
  newsSourceInvestments: ReturnType<typeof mapNewsSourceInvestment>[];
  investments: ReturnType<typeof mapInvestment>[];
  investmentCategories: ReturnType<typeof mapInvestmentCategory>[];
  affiliations: ReturnType<typeof mapAffiliation>[];
  blogPosts: ReturnType<typeof mapBlogPost>[];
  newsletterCampaigns: ReturnType<typeof mapNewsletterCampaign>[];
}

const PUBLIC_PAGE_COPY = {
  home: {
    research: [
      'Ethereum',
      'Programmable Cryptography (ZK, FHE, MPC, TEE)',
      'Digital Identity',
      'Distributed Systems',
      'Decentralized AI',
    ],
    engineering: ['Rust', 'Solidity', 'Full Stack'],
    angelInvesting:
      'Supporting teams building cool things in areas programmable cryptography, distributed systems, digital identity, AI, scalability, privacy, more.',
  },
  about: {
    bio: [
      'My meta-goal is to maximize positive impact I have on the world and help people take humanity to a new age of prosperity and abundance.',
      'After a few years trying out different things I decided that cryptography and distributed systems are the domains that interest me most.',
    ],
  },
  jobs: {
    title: 'Jobs',
    description:
      "Open positions at companies I've invested in, advise, work with, or am friends with. These are teams I believe in building products that matter.",
    helpText:
      'Am I missing any job openings, or are any no longer available? Please let me know on',
    telegramUrl: 'https://t.me/dcbuilder',
  },
  candidates: {
    title: 'Candidates',
    description:
      "Talented builders looking for new opportunities. I've personally vouched each candidate.",
  },
  portfolio: {
    disclaimer:
      'All information and opinions presented on the website reflect only my personal views and experiences. They are not intended to represent or imply the views, policies, or endorsements of any organization, entity, or other individuals. Investments, strategies, and opinions expressed are solely my own and should not be considered financial advice.',
  },
  news: { title: 'News', description: 'Curated articles, blog posts, and site announcements.' },
  blog: { title: 'Blog' },
} as const;

export function buildPortalPublicSitePayload(
  rows: PortalPublicSiteRows,
  fetchedAt = new Date()
): PublicSitePayload {
  const jobCounts = countBy(rows.jobs, (job) => job.company);
  const newsCounts = countBy(rows.announcements, (item) => item.company);

  return {
    source: 'dcbuilder.dev',
    fetchedAt: fetchedAt.toISOString(),
    baseUrl: 'https://dcbuilder.dev',
    pages: PUBLIC_PAGE_COPY,
    jobs: [...rows.jobs].sort(compareJobs).map(mapJob),
    jobTags: [...rows.jobTags].sort(compareLabel).map(mapJobTag),
    jobRoles: [...rows.jobRoles].sort(compareLabel).map(mapJobRole),
    candidates: [...rows.candidates].sort(compareCandidates).map(mapCandidate),
    candidateRedirects: [...rows.candidateRedirects]
      .sort((left, right) => compareDateDescending(left.createdAt, right.createdAt))
      .map(mapCandidateRedirect),
    news: [
      ...rows.curatedLinks.map(mapCuratedLink),
      ...rows.announcements.map(mapAnnouncement),
    ].sort(compareNews),
    newsSourceInvestments: [...rows.newsSourceInvestments]
      .sort((left, right) => compareDateDescending(left.updatedAt, right.updatedAt))
      .map(mapNewsSourceInvestment),
    investments: [...rows.investments]
      .sort(compareInvestments)
      .map((investment) =>
        mapInvestment(
          investment,
          jobCounts.get(normalizeKey(investment.title)) ?? 0,
          newsCounts.get(normalizeKey(investment.title)) ?? 0
        )
      ),
    investmentCategories: [...rows.investmentCategories]
      .sort(compareLabel)
      .map(mapInvestmentCategory),
    affiliations: [...rows.affiliations].sort(compareAffiliations).map(mapAffiliation),
    blogPosts: rows.blogPosts
      .filter((post) => post.published === true)
      .sort(compareBlogPosts)
      .map(mapBlogPost),
    newsletterCampaigns: rows.newsletterCampaigns
      .filter((campaign) => campaign.status === 'sent')
      .sort((left, right) => compareDateDescending(left.createdAt, right.createdAt))
      .map(mapNewsletterCampaign),
  };
}

function mapJob(row: PortalPublicJobRow) {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    companyLogo: row.companyLogo,
    link: row.link,
    location: row.location,
    remote: row.remote,
    type: row.type,
    salary: row.salary,
    department: row.department,
    tags: row.tags,
    category: row.category,
    featured: row.featured,
    description: row.description,
    responsibilities: row.responsibilities,
    qualifications: row.qualifications,
    benefits: row.benefits,
    companyWebsite: row.companyWebsite,
    companyX: row.companyX,
    companyGithub: row.companyGithub,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function mapJobTag(row: PortalPublicSiteRows['jobTags'][number]) {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    color: row.color,
    createdAt: iso(row.createdAt),
  };
}

function mapJobRole(row: PortalPublicSiteRows['jobRoles'][number]) {
  return { id: row.id, slug: row.slug, label: row.label, createdAt: iso(row.createdAt) };
}

function mapCandidate(row: PortalPublicCandidateRow) {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    location: row.location,
    summary: row.summary,
    skills: row.skills,
    experience: row.experience,
    education: row.education,
    image: row.image,
    cv: row.cv,
    featured: row.featured,
    available: row.available,
    availability: row.availability,
    email: row.email,
    telegram: row.telegram,
    calendly: row.calendly,
    x: row.x,
    github: row.github,
    linkedin: row.linkedin,
    website: row.website,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function mapCandidateRedirect(row: PortalPublicSiteRows['candidateRedirects'][number]) {
  return { oldId: row.oldId, newId: row.newId, createdAt: iso(row.createdAt) };
}

function mapCuratedLink(row: PortalPublicCuratedLinkRow) {
  return {
    id: row.id,
    kind: 'curated-link' as const,
    title: row.title,
    url: row.url,
    source: row.source,
    sourceImage: row.sourceImage,
    company: null,
    companyLogo: null,
    platform: null,
    date: iso(row.date),
    description: row.description,
    category: row.category,
    featured: row.featured,
    relevance: row.relevance,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function mapAnnouncement(row: PortalPublicAnnouncementRow) {
  return {
    id: row.id,
    kind: 'announcement' as const,
    title: row.title,
    url: row.url,
    source: row.company,
    sourceImage: row.companyLogo,
    company: row.company,
    companyLogo: row.companyLogo,
    platform: row.platform,
    date: iso(row.date),
    description: row.description,
    category: row.category,
    featured: row.featured,
    relevance: row.relevance,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function mapNewsSourceInvestment(row: PortalPublicSiteRows['newsSourceInvestments'][number]) {
  return {
    id: row.id,
    sourceType: row.sourceType,
    sourceValue: row.sourceValue,
    sourceKind: row.sourceKind,
    investmentId: row.investmentId,
    companyTitle: row.companyTitle,
    companyLogo: row.companyLogo,
    companyWebsite: row.companyWebsite,
    jobCompanies: row.jobCompanies,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function mapInvestment(row: PortalPublicInvestmentRow, jobCount: number, newsCount: number) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    logo: row.logo,
    tier: row.tier,
    featured: row.featured,
    status: row.status,
    categories: row.categories,
    website: row.website,
    x: row.x,
    github: row.github,
    jobCount,
    newsCount,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function mapInvestmentCategory(row: PortalPublicSiteRows['investmentCategories'][number]) {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    color: row.color,
    createdAt: iso(row.createdAt),
  };
}

function mapAffiliation(row: PortalPublicAffiliationRow) {
  return {
    id: row.id,
    title: row.title,
    role: row.role,
    dateBegin: row.dateBegin,
    dateEnd: row.dateEnd,
    description: row.description,
    imageUrl: row.imageUrl,
    logo: row.logo,
    website: row.website,
    xHandles: row.xHandles,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function mapBlogPost(row: PortalPublicBlogPostRow) {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    content: row.content,
    date: iso(row.date),
    source: row.source,
    sourceUrl: row.sourceUrl,
    image: row.image,
    published: true,
    relevance: row.relevance,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function mapNewsletterCampaign(row: PortalPublicNewsletterCampaignRow) {
  return {
    id: row.id,
    publicSlug: row.publicSlug,
    newsletterType: row.newsletterType,
    subject: row.subject,
    previewText: row.previewText,
    contentMode: row.contentMode,
    markdownContent: row.markdownContent,
    archiveSubject: row.archiveSubject,
    archivePreviewText: row.archivePreviewText,
    archiveMarkdownContent: row.archiveMarkdownContent,
    status: 'sent',
    periodDays: row.periodDays,
    timeframePreset: row.timeframePreset,
    minimumRelevance: row.minimumRelevance,
    scheduledAt: nullableIso(row.scheduledAt),
    sentAt: nullableIso(row.sentAt),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function compareJobs(left: PortalPublicJobRow, right: PortalPublicJobRow): number {
  return (
    Number(right.featured === true) - Number(left.featured === true) ||
    compareDateDescending(left.updatedAt, right.updatedAt) ||
    left.company.localeCompare(right.company) ||
    left.title.localeCompare(right.title)
  );
}

function compareCandidates(
  left: PortalPublicCandidateRow,
  right: PortalPublicCandidateRow
): number {
  return (
    Number(right.featured === true) - Number(left.featured === true) ||
    Number(right.available === true) - Number(left.available === true) ||
    compareDateDescending(left.updatedAt, right.updatedAt) ||
    left.name.localeCompare(right.name)
  );
}

function compareNews(
  left: ReturnType<typeof mapCuratedLink> | ReturnType<typeof mapAnnouncement>,
  right: ReturnType<typeof mapCuratedLink> | ReturnType<typeof mapAnnouncement>
): number {
  return (
    right.date.localeCompare(left.date) ||
    right.relevance - left.relevance ||
    left.title.localeCompare(right.title)
  );
}

function compareInvestments(
  left: PortalPublicInvestmentRow,
  right: PortalPublicInvestmentRow
): number {
  return (
    numericTier(left.tier) - numericTier(right.tier) ||
    Number(right.featured === true) - Number(left.featured === true) ||
    left.title.localeCompare(right.title)
  );
}

function compareAffiliations(
  left: PortalPublicAffiliationRow,
  right: PortalPublicAffiliationRow
): number {
  return (
    compareDateDescending(left.updatedAt, right.updatedAt) || left.title.localeCompare(right.title)
  );
}

function compareBlogPosts(left: PortalPublicBlogPostRow, right: PortalPublicBlogPostRow): number {
  return (
    compareDateDescending(left.date, right.date) ||
    right.relevance - left.relevance ||
    left.title.localeCompare(right.title)
  );
}

function compareLabel(left: { label: string }, right: { label: string }): number {
  return left.label.localeCompare(right.label);
}

function compareDateDescending(left: DateValue, right: DateValue): number {
  return iso(right).localeCompare(iso(left));
}

function countBy<T>(rows: T[], key: (row: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const normalized = normalizeKey(key(row));
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  return counts;
}

function normalizeKey(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

function numericTier(value: string | null): number {
  return value && /^\d+$/.test(value) ? Number.parseInt(value, 10) : 999;
}

function iso(value: DateValue): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function nullableIso(value: DateValue | null): string | null {
  return value === null ? null : iso(value);
}
