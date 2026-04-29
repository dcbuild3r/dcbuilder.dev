import { getAllPosts } from "./blog";
import { db } from "@/db";
import { curatedLinks as curatedLinksTable, announcements as announcementsTable } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NewsCategory } from "@/data/news";
import { isMissingColumnError } from "@/lib/db-schema-compat";
import { compareNewsByDateAndRelevance } from "@/lib/news-sorting";

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

export async function getAllNews(): Promise<AggregatedNewsItem[]> {
  // Fetch all data sources in parallel
  const [blogPosts, dbCuratedLinks, dbAnnouncements] = await Promise.all([
    getAllPosts(),
    getCuratedLinksWithFallback(),
    getAnnouncementsWithFallback(),
  ]);

  // Map blog posts
  const blogItems: AggregatedNewsItem[] = blogPosts.map((post) => ({
    id: `blog-${post.slug}`,
    type: "blog" as const,
    title: post.title,
    url: `/blog/${post.slug}`,
    date: post.date,
    postedAt: post.createdAt,
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
    postedAt: link.createdAt.toISOString(),
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
    postedAt: ann.createdAt.toISOString(),
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
