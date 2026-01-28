import { getAllPosts } from "./blog";
import { curatedLinks, announcements, NewsCategory } from "@/data/news";

export interface AggregatedNewsItem {
  id: string;
  type: "curated" | "blog" | "announcement";
  title: string;
  url: string;
  date: string;
  description?: string;
  category: NewsCategory;
  featured?: boolean;
  // Type-specific fields
  source?: string; // For curated links
  company?: string; // For announcements
  companyLogo?: string; // For announcements
  platform?: string; // For announcements
  readingTime?: string; // For blog posts
}

export async function getAllNews(): Promise<AggregatedNewsItem[]> {
  // Get blog posts
  const blogPosts = await getAllPosts();
  const blogItems: AggregatedNewsItem[] = blogPosts.map((post) => ({
    id: `blog-${post.slug}`,
    type: "blog" as const,
    title: post.title,
    url: `/blog/${post.slug}`,
    date: post.date,
    description: post.description,
    category: "general" as NewsCategory,
    readingTime: post.readingTime,
  }));

  // Get curated links
  const curatedItems: AggregatedNewsItem[] = curatedLinks.map((link) => ({
    id: link.id,
    type: "curated" as const,
    title: link.title,
    url: link.url,
    date: link.date,
    description: link.description,
    category: link.category,
    featured: link.featured,
    source: link.source,
  }));

  // Get announcements
  const announcementItems: AggregatedNewsItem[] = announcements.map((ann) => ({
    id: ann.id,
    type: "announcement" as const,
    title: ann.title,
    url: ann.url,
    date: ann.date,
    description: ann.description,
    category: ann.category,
    featured: ann.featured,
    company: ann.company,
    companyLogo: ann.companyLogo,
    platform: ann.platform,
  }));

  // Combine and sort by date (newest first)
  const allNews = [...blogItems, ...curatedItems, ...announcementItems];
  allNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
