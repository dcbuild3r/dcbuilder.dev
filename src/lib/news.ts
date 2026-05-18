import { getAllPosts } from "./blog";
import { db } from "@/db";
import {
  curatedLinks as curatedLinksTable,
  announcements as announcementsTable,
  newsSourceInvestments as newsSourceInvestmentsTable,
  investments as investmentsTable,
  jobs as jobsTable,
} from "@/db/schema";
import { desc, inArray, sql } from "drizzle-orm";
import { NewsCategory } from "@/data/news";
import { isMissingColumnError, isMissingRelationError } from "@/lib/db-schema-compat";
import { compareNewsByDateAndRelevance } from "@/lib/news-sorting";
import {
  getPortfolioJobCompanies,
  getPortfolioJobCount,
  getPortfolioJobsUrl,
} from "@/lib/portfolio-jobs";

interface PortfolioCompanyNewsContext {
  title: string;
  logo: string | null;
  website: string | null;
  jobsUrl: string;
  jobCount: number;
  sourceIsCompanyAccount: boolean;
}

const STARTER_SOURCE_INVESTMENT_MAPPINGS = [
  {
    sourceType: "x_handle",
    sourceValue: "benjamintfels",
    sourceKind: "person",
    investmentTitle: "Octet",
  },
  {
    sourceType: "blog_host",
    sourceValue: "benjaminfels.substack.com",
    sourceKind: "person",
    investmentTitle: "Octet",
  },
  {
    sourceType: "x_handle",
    sourceValue: "primeintellect",
    sourceKind: "company",
    investmentTitle: "Prime Intellect",
  },
  {
    sourceType: "x_handle",
    sourceValue: "succinctlabs",
    sourceKind: "company",
    investmentTitle: "Succinct",
  },
  {
    sourceType: "x_handle",
    sourceValue: "megaeth",
    sourceKind: "company",
    investmentTitle: "MegaETH",
  },
  {
    sourceType: "x_handle",
    sourceValue: "praxisnation",
    sourceKind: "company",
    investmentTitle: "Praxis",
  },
  {
    sourceType: "x_handle",
    sourceValue: "morpho",
    sourceKind: "company",
    investmentTitle: "Morpho",
  },
  {
    sourceType: "x_handle",
    sourceValue: "alignedlayer",
    sourceKind: "company",
    investmentTitle: "Aligned Layer",
  },
  {
    sourceType: "x_handle",
    sourceValue: "gizatechxyz",
    sourceKind: "company",
    investmentTitle: "Giza",
  },
  {
    sourceType: "x_handle",
    sourceValue: "0xknoxfi",
    sourceKind: "company",
    investmentTitle: "GasHawk",
  },
  {
    sourceType: "x_handle",
    sourceValue: "lighter_xyz",
    sourceKind: "company",
    investmentTitle: "Lighter",
  },
  {
    sourceType: "x_handle",
    sourceValue: "avischiffmann",
    sourceKind: "person",
    investmentTitle: "Friend",
  },
];

export interface AggregatedNewsItem {
  id: string;
  type: "curated" | "blog" | "announcement";
  title: string;
  url: string;
  date: string;
  postedAt: string;
  description?: string;
  category: NewsCategory;
  featured?: boolean;
  relevance: number;
  // Type-specific fields
  source?: string; // For curated links
  sourceImage?: string; // For curated links
  company?: string; // For announcements
  companyLogo?: string; // For announcements
  platform?: string; // For announcements
  readingTime?: string; // For blog posts
  image?: string; // For blog posts
  portfolioCompany?: PortfolioCompanyNewsContext;
}

function toIsoDateTime(date: string | Date | null | undefined, fallback?: string | Date | null): string {
  const parsed = new Date(date ?? fallback ?? 0);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

async function getCuratedLinksWithFallback() {
  try {
    return await db
      .select()
      .from(curatedLinksTable)
      .orderBy(desc(curatedLinksTable.date));
  } catch (error) {
    if (isMissingColumnError(error, "relevance")) {
      console.warn("[news] curated_links.relevance missing, using compatibility fallback");

      try {
        const rows = await db
          .select({
            id: curatedLinksTable.id,
            title: curatedLinksTable.title,
            url: curatedLinksTable.url,
            source: curatedLinksTable.source,
            sourceImage: curatedLinksTable.sourceImage,
            date: curatedLinksTable.date,
            description: curatedLinksTable.description,
            category: curatedLinksTable.category,
            featured: curatedLinksTable.featured,
            createdAt: curatedLinksTable.createdAt,
          })
          .from(curatedLinksTable)
          .orderBy(desc(curatedLinksTable.date));

        return rows.map((row) => ({
          ...row,
          relevance: 5,
        }));
      } catch (fallbackError) {
        console.error("[news] Curated links compatibility fallback failed:", fallbackError);
        return [];
      }
    }

    console.error("[news] Failed to fetch curated links:", error);
    return [];
  }
}

async function getAnnouncementsWithFallback() {
  try {
    return await db
      .select()
      .from(announcementsTable)
      .orderBy(desc(announcementsTable.date));
  } catch (error) {
    if (isMissingColumnError(error, "relevance")) {
      console.warn("[news] announcements.relevance missing, using compatibility fallback");

      try {
        const rows = await db
          .select({
            id: announcementsTable.id,
            title: announcementsTable.title,
            url: announcementsTable.url,
            company: announcementsTable.company,
            companyLogo: announcementsTable.companyLogo,
            platform: announcementsTable.platform,
            date: announcementsTable.date,
            description: announcementsTable.description,
            category: announcementsTable.category,
            featured: announcementsTable.featured,
            createdAt: announcementsTable.createdAt,
          })
          .from(announcementsTable)
          .orderBy(desc(announcementsTable.date));

        return rows.map((row) => ({
          ...row,
          relevance: 5,
        }));
      } catch (fallbackError) {
        console.error("[news] Announcements compatibility fallback failed:", fallbackError);
        return [];
      }
    }

    console.error("[news] Failed to fetch announcements:", error);
    return [];
  }
}

function normalizeXHandle(value: string): string {
  return value.trim().replace(/^@/, "").toLowerCase();
}

function normalizeHost(value: string): string {
  return value.trim().replace(/^www\./, "").toLowerCase();
}

function getUrlHost(value: string): string | null {
  try {
    const url = new URL(value);
    return normalizeHost(url.hostname);
  } catch {
    return null;
  }
}

function getXHandleFromUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const host = normalizeHost(url.hostname);
    if (host !== "x.com" && host !== "twitter.com") return null;

    const [handle] = url.pathname.split("/").filter(Boolean);
    if (!handle || ["i", "intent", "share"].includes(handle)) return null;

    return normalizeXHandle(handle);
  } catch {
    return null;
  }
}

function getSourceLookupKeys(item: AggregatedNewsItem): string[] {
  const keys = new Set<string>();
  const xHandle = getXHandleFromUrl(item.url);

  if (xHandle) {
    keys.add(`x_handle:${xHandle}`);
    return Array.from(keys);
  }

  const host = getUrlHost(item.url);
  if (host) {
    keys.add(`blog_host:${host}`);
  }

  return Array.from(keys);
}

async function getPortfolioCompanyContextsBySource() {
  const contexts = new Map<string, PortfolioCompanyNewsContext>();

  try {
    if (!investmentsTable) {
      return contexts;
    }

    let mappings: Array<{
      sourceType: string;
      sourceValue: string;
      sourceKind: string | null;
      investmentId: string;
    }> = [];

    if (newsSourceInvestmentsTable) {
      try {
        mappings = await db
          .select({
            sourceType: newsSourceInvestmentsTable.sourceType,
            sourceValue: newsSourceInvestmentsTable.sourceValue,
            sourceKind: newsSourceInvestmentsTable.sourceKind,
            investmentId: newsSourceInvestmentsTable.investmentId,
          })
          .from(newsSourceInvestmentsTable);
      } catch (error) {
        if (isMissingColumnError(error, "source_kind")) {
          mappings = (
            await db
              .select({
                sourceType: newsSourceInvestmentsTable.sourceType,
                sourceValue: newsSourceInvestmentsTable.sourceValue,
                investmentId: newsSourceInvestmentsTable.investmentId,
              })
              .from(newsSourceInvestmentsTable)
          ).map((mapping) => ({ ...mapping, sourceKind: null }));
        } else if (!isMissingRelationError(error, "news_source_investments")) {
          console.error("[news] Failed to load portfolio source mappings:", error);
        }
      }
    }

    const investmentIds = Array.from(new Set(mappings.map((mapping) => mapping.investmentId)));
    const starterInvestmentTitles = Array.from(
      new Set(STARTER_SOURCE_INVESTMENT_MAPPINGS.map((mapping) => mapping.investmentTitle))
    );
    const [mappedInvestments, starterInvestments] = await Promise.all([
      investmentIds.length > 0
        ? db
            .select({
              id: investmentsTable.id,
              title: investmentsTable.title,
              logo: investmentsTable.logo,
              website: investmentsTable.website,
            })
            .from(investmentsTable)
            .where(inArray(investmentsTable.id, investmentIds))
        : Promise.resolve([]),
      starterInvestmentTitles.length > 0
        ? db
            .select({
              id: investmentsTable.id,
              title: investmentsTable.title,
              logo: investmentsTable.logo,
              website: investmentsTable.website,
            })
            .from(investmentsTable)
            .where(inArray(investmentsTable.title, starterInvestmentTitles))
        : Promise.resolve([]),
    ]);

    const investments = Array.from(
      new Map([...mappedInvestments, ...starterInvestments].map((investment) => [investment.id, investment])).values()
    );
    if (investments.length === 0) {
      return contexts;
    }

    const investmentsById = new Map(investments.map((investment) => [investment.id, investment]));
    const investmentsByTitle = new Map(investments.map((investment) => [investment.title, investment]));
    const jobCompanies = Array.from(
      new Set(investments.flatMap((investment) => getPortfolioJobCompanies(investment.title)))
    );

    let jobCountsByCompany: Record<string, number> = {};
    if (jobsTable && jobCompanies.length > 0) {
      try {
        jobCountsByCompany = Object.fromEntries(
          (
            await db
              .select({
                company: jobsTable.company,
                count: sql<number>`count(*)::int`,
              })
              .from(jobsTable)
              .where(inArray(jobsTable.company, jobCompanies))
              .groupBy(jobsTable.company)
          ).map((row) => [row.company, row.count])
        );
      } catch (error) {
        console.error("[news] Failed to load portfolio job counts:", error);
        try {
          const jobRows = await db
            .select({ company: jobsTable.company })
            .from(jobsTable)
            .where(inArray(jobsTable.company, jobCompanies));

          jobCountsByCompany = jobRows.reduce<Record<string, number>>((counts, row) => {
            counts[row.company] = (counts[row.company] || 0) + 1;
            return counts;
          }, {});
        } catch (fallbackError) {
          console.error("[news] Portfolio job count fallback failed:", fallbackError);
        }
      }
    }

    const setContext = (
      sourceType: string,
      rawSourceValue: string,
      investment: (typeof investments)[number] | undefined,
      rawSourceKind: string | null | undefined
    ) => {
      if (!investment) return;

      const sourceValue =
        sourceType === "x_handle" ? normalizeXHandle(rawSourceValue) : normalizeHost(rawSourceValue);
      const sourceKind = rawSourceKind?.trim().toLowerCase();

      contexts.set(`${sourceType}:${sourceValue}`, {
        title: investment.title,
        logo: investment.logo,
        website: investment.website,
        jobsUrl: getPortfolioJobsUrl(investment.title),
        jobCount: getPortfolioJobCount(investment.title, jobCountsByCompany),
        sourceIsCompanyAccount: sourceKind === "company",
      });
    };

    mappings.forEach((mapping) => {
      setContext(
        mapping.sourceType.trim(),
        mapping.sourceValue,
        investmentsById.get(mapping.investmentId),
        mapping.sourceKind
      );
    });

    STARTER_SOURCE_INVESTMENT_MAPPINGS.forEach((mapping) => {
      const sourceValue =
        mapping.sourceType === "x_handle"
          ? normalizeXHandle(mapping.sourceValue)
          : normalizeHost(mapping.sourceValue);
      const key = `${mapping.sourceType}:${sourceValue}`;
      if (contexts.has(key)) return;

      setContext(
        mapping.sourceType,
        mapping.sourceValue,
        investmentsByTitle.get(mapping.investmentTitle),
        mapping.sourceKind
      );
    });
  } catch (error) {
    console.error("[news] Failed to load portfolio source mappings:", error);
  }

  return contexts;
}

export async function getAllNews(): Promise<AggregatedNewsItem[]> {
  // Fetch all data sources in parallel
  const [blogPosts, dbCuratedLinks, dbAnnouncements, portfolioCompanyContexts] = await Promise.all([
    getAllPosts(),
    getCuratedLinksWithFallback(),
    getAnnouncementsWithFallback(),
    getPortfolioCompanyContextsBySource(),
  ]);

  // Map blog posts
  const blogItems: AggregatedNewsItem[] = blogPosts.map((post) => ({
    id: `blog-${post.slug}`,
    type: "blog" as const,
    title: post.title,
    url: `/blog/${post.slug}`,
    date: post.date,
    postedAt: toIsoDateTime(post.createdAt, post.date),
    description: post.description,
    category: "general" as NewsCategory,
    readingTime: `${post.readingTime} min read`,
    image: post.image,
    relevance: post.relevance,
  }));

  // Map curated links
  const curatedItems: AggregatedNewsItem[] = dbCuratedLinks.map((link) => ({
    id: link.id,
    type: "curated" as const,
    title: link.title,
    url: link.url,
    date: link.date.toISOString().split("T")[0],
    postedAt: toIsoDateTime(link.createdAt, link.date),
    description: link.description || undefined,
    category: link.category as NewsCategory,
    featured: link.featured || false,
    relevance: link.relevance,
    source: link.source,
    sourceImage: link.sourceImage || undefined,
  }));

  // Map announcements
  const announcementItems: AggregatedNewsItem[] = dbAnnouncements.map((ann) => ({
    id: ann.id,
    type: "announcement" as const,
    title: ann.title,
    url: ann.url,
    date: ann.date.toISOString().split("T")[0],
    postedAt: toIsoDateTime(ann.createdAt, ann.date),
    description: ann.description || undefined,
    category: ann.category as NewsCategory,
    featured: ann.featured || false,
    relevance: ann.relevance,
    company: ann.company,
    companyLogo: ann.companyLogo || undefined,
    platform: ann.platform,
  }));

  // Combine and sort by date, then relevance for same-day items.
  const allNews = [...blogItems, ...curatedItems, ...announcementItems];
  allNews.forEach((item) => {
    const portfolioCompany = getSourceLookupKeys(item)
      .map((key) => portfolioCompanyContexts.get(key))
      .find(Boolean);

    if (portfolioCompany) {
      item.portfolioCompany = portfolioCompany;
    }
  });
  allNews.sort(compareNewsByDateAndRelevance);

  return allNews;
}

export function filterNewsByType(
  news: AggregatedNewsItem[],
  type: "all" | "curated" | "blog" | "announcement"
): AggregatedNewsItem[] {
  if (type === "all") return news;
  return news.filter((item) => item.type === type);
}

export function filterNewsByCategory(
  news: AggregatedNewsItem[],
  category: "all" | NewsCategory
): AggregatedNewsItem[] {
  if (category === "all") return news;
  return news.filter((item) => item.category === category);
}
