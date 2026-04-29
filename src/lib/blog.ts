import { db, blogPosts } from "@/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { isMissingColumnError } from "@/lib/db-schema-compat";

const FALLBACK_DATE = "1970-01-01";

// View model types (distinct from database types in schema.ts)
export interface BlogPostView {
  slug: string;
  title: string;
  date: string;
  createdAt: string;
  description: string;
  content: string;
  source?: string;
  sourceUrl?: string;
  readingTime: number;
  image?: string;
  relevance: number;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  createdAt: string;
  description: string;
  source?: string;
  sourceUrl?: string;
  readingTime: number;
  image?: string;
  relevance: number;
}

// Re-export for backwards compatibility
export type BlogPost = BlogPostView;

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function formatDateString(date: Date | null, slug?: string): string {
  if (!date) {
    console.warn(`[blog] Null date encountered${slug ? ` for slug: ${slug}` : ""}`);
    return FALLBACK_DATE;
  }
  return date.toISOString().split("T")[0];
}

function formatDateTimeString(date: Date | null | undefined): string {
  return (date ?? new Date(0)).toISOString();
}

export function formatBlogDate(dateString: string): string {
  if (dateString === FALLBACK_DATE) {
    return "Unknown date";
  }
  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) {
    return "Unknown date";
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  try {
    const posts = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(
        desc(sql`date_trunc('day', ${blogPosts.date})`),
        desc(blogPosts.relevance),
        desc(blogPosts.date)
      );

    return posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      date: formatDateString(post.date, post.slug),
      createdAt: formatDateTimeString(post.createdAt),
      description: post.description || "",
      source: post.source || undefined,
      sourceUrl: post.sourceUrl || undefined,
      readingTime: calculateReadingTime(post.content),
      image: post.image || undefined,
      relevance: post.relevance,
    }));
  } catch (error) {
    if (isMissingColumnError(error, "relevance")) {
      console.warn("[blog] blog_posts.relevance missing, using compatibility fallback");

      try {
        const posts = await db
          .select({
            slug: blogPosts.slug,
            title: blogPosts.title,
            date: blogPosts.date,
            description: blogPosts.description,
            content: blogPosts.content,
            source: blogPosts.source,
            sourceUrl: blogPosts.sourceUrl,
            image: blogPosts.image,
            createdAt: blogPosts.createdAt,
          })
          .from(blogPosts)
          .where(eq(blogPosts.published, true))
          .orderBy(desc(blogPosts.date));

        return posts.map((post) => ({
          slug: post.slug,
          title: post.title,
          date: formatDateString(post.date, post.slug),
          createdAt: formatDateTimeString(post.createdAt),
          description: post.description || "",
          source: post.source || undefined,
          sourceUrl: post.sourceUrl || undefined,
          readingTime: calculateReadingTime(post.content),
          image: post.image || undefined,
          relevance: 5,
        }));
      } catch (fallbackError) {
        console.error("[blog] Compatibility fallback failed:", fallbackError);
        return [];
      }
    }

    console.error("[blog] Failed to fetch all posts:", error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
      .limit(1);

    if (!post) return null;

    return {
      slug: post.slug,
      title: post.title,
      date: formatDateString(post.date, post.slug),
      createdAt: formatDateTimeString(post.createdAt),
      description: post.description || "",
      content: post.content,
      source: post.source || undefined,
      sourceUrl: post.sourceUrl || undefined,
      readingTime: calculateReadingTime(post.content),
      image: post.image || undefined,
      relevance: post.relevance,
    };
  } catch (error) {
    console.error(`[blog] Failed to fetch post by slug "${slug}":`, error);
    return null;
  }
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    const posts = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.published, true));

    return posts.map((p) => p.slug);
  } catch (error) {
    console.error("[blog] Failed to fetch all slugs:", error);
    return [];
  }
}
