import { getAllPosts } from "./blog";
import { db } from "@/db";
import { curatedLinks as curatedLinksTable, announcements as announcementsTable } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { NewsCategory } from "@/data/news";
import { compareNewsByDateAndRelevance } from "@/lib/news-sorting";

export interface AggregatedNewsItem {
  id: string;
  type: "curated" | "blog" | "announcement";
  title: string;
  url: string;
  date: string;
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

export async function getAllNews(): Promise<AggregatedNewsItem[]> {
  // Fetch all data sources in parallel
  const [blogPosts, dbCuratedLinks, dbAnnouncements] = await Promise.all([
    getAllPosts(),
    db
      .select()
      .from(curatedLinksTable)
      .orderBy(
        desc(sql`date_trunc('day', ${curatedLinksTable.date})`),
        desc(curatedLinksTable.relevance),
        desc(curatedLinksTable.date)
      ),
    db
      .select()
      .from(announcementsTable)
      .orderBy(
        desc(sql`date_trunc('day', ${announcementsTable.date})`),
        desc(announcementsTable.relevance),
        desc(announcementsTable.date)
      ),
  ]);

  // Map blog posts
  const blogItems: AggregatedNewsItem[] = blogPosts.map((post) => ({
    id: `blog-${post.slug}`,
    type: "blog" as const,
    title: post.title,
    url: `/blog/${post.slug}`,
    date: post.date,
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
