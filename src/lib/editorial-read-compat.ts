import { announcements, blogPosts, curatedLinks, db } from "@/db";
import { desc, eq, SQL } from "drizzle-orm";
import { isMissingColumnError } from "@/lib/db-schema-compat";

type WhereClause = SQL | undefined;

export async function listCuratedLinksCompat(params: {
  whereClause?: WhereClause;
  limit: number;
  offset: number;
}) {
  const { whereClause, limit, offset } = params;

  try {
    return await db
      .select()
      .from(curatedLinks)
      .where(whereClause)
      .orderBy(desc(curatedLinks.date))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    if (!isMissingColumnError(error, "relevance")) {
      throw error;
    }

    console.warn("[editorial-read-compat] curated_links.relevance missing, using compatibility fallback");

    const rows = await db
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
        createdAt: curatedLinks.createdAt,
        updatedAt: curatedLinks.updatedAt,
      })
      .from(curatedLinks)
      .where(whereClause)
      .orderBy(desc(curatedLinks.date))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => ({
      ...row,
      relevance: 5,
    }));
  }
}

export async function getCuratedLinkByIdCompat(id: string) {
  try {
    const [link] = await db
      .select()
      .from(curatedLinks)
      .where(eq(curatedLinks.id, id))
      .limit(1);

    return link ?? null;
  } catch (error) {
    if (!isMissingColumnError(error, "relevance")) {
      throw error;
    }

    console.warn("[editorial-read-compat] curated_links.relevance missing on by-id read, using compatibility fallback");

    const [link] = await db
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
        createdAt: curatedLinks.createdAt,
        updatedAt: curatedLinks.updatedAt,
      })
      .from(curatedLinks)
      .where(eq(curatedLinks.id, id))
      .limit(1);

    return link
      ? {
          ...link,
          relevance: 5,
        }
      : null;
  }
}

export async function listAnnouncementsCompat(params: {
  whereClause?: WhereClause;
  limit: number;
  offset: number;
}) {
  const { whereClause, limit, offset } = params;

  try {
    return await db
      .select()
      .from(announcements)
      .where(whereClause)
      .orderBy(desc(announcements.date))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    if (!isMissingColumnError(error, "relevance")) {
      throw error;
    }

    console.warn("[editorial-read-compat] announcements.relevance missing, using compatibility fallback");

    const rows = await db
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
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
      })
      .from(announcements)
      .where(whereClause)
      .orderBy(desc(announcements.date))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => ({
      ...row,
      relevance: 5,
    }));
  }
}

export async function getAnnouncementByIdCompat(id: string) {
  try {
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);

    return announcement ?? null;
  } catch (error) {
    if (!isMissingColumnError(error, "relevance")) {
      throw error;
    }

    console.warn("[editorial-read-compat] announcements.relevance missing on by-id read, using compatibility fallback");

    const [announcement] = await db
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
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
      })
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);

    return announcement
      ? {
          ...announcement,
          relevance: 5,
        }
      : null;
  }
}

export async function listBlogPostsCompat(includeUnpublished: boolean) {
  try {
    if (includeUnpublished) {
      return await db
        .select()
        .from(blogPosts)
        .orderBy(desc(blogPosts.date));
    }

    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.date));
  } catch (error) {
    if (!isMissingColumnError(error, "relevance")) {
      throw error;
    }

    console.warn("[editorial-read-compat] blog_posts.relevance missing, using compatibility fallback");

    const baseQuery = db
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
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
      })
      .from(blogPosts);

    const rows = includeUnpublished
      ? await baseQuery.orderBy(desc(blogPosts.date))
      : await baseQuery.where(eq(blogPosts.published, true)).orderBy(desc(blogPosts.date));

    return rows.map((row) => ({
      ...row,
      relevance: 5,
    }));
  }
}

export async function getBlogPostBySlugCompat(slug: string) {
  try {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    return post ?? null;
  } catch (error) {
    if (!isMissingColumnError(error, "relevance")) {
      throw error;
    }

    console.warn("[editorial-read-compat] blog_posts.relevance missing on by-slug read, using compatibility fallback");

    const [post] = await db
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
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    return post
      ? {
          ...post,
          relevance: 5,
        }
      : null;
  }
}
