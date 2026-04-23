import { afterEach, describe, expect, mock, test } from "bun:test";
import { dbTableExportPlaceholders } from "./helpers/db-module-mock";

function createMissingRelevanceError(tableName: string) {
  const cause = new Error(`column "${tableName}"."relevance" does not exist`) as Error & {
    code?: string;
  };
  cause.code = "42703";

  const error = new Error("Failed query") as Error & { cause?: Error };
  error.cause = cause;
  return error;
}

describe("editorial read compatibility", () => {
  afterEach(() => {
    mock.restore();
  });

  test("falls back for curated links, announcements, and blog posts when relevance is missing", async () => {
    const curatedLinks = {
      id: Symbol("curated.id"),
      title: Symbol("curated.title"),
      url: Symbol("curated.url"),
      source: Symbol("curated.source"),
      sourceImage: Symbol("curated.sourceImage"),
      date: Symbol("curated.date"),
      description: Symbol("curated.description"),
      category: Symbol("curated.category"),
      featured: Symbol("curated.featured"),
      createdAt: Symbol("curated.createdAt"),
      updatedAt: Symbol("curated.updatedAt"),
    };

    const announcements = {
      id: Symbol("announcements.id"),
      title: Symbol("announcements.title"),
      url: Symbol("announcements.url"),
      company: Symbol("announcements.company"),
      companyLogo: Symbol("announcements.companyLogo"),
      platform: Symbol("announcements.platform"),
      date: Symbol("announcements.date"),
      description: Symbol("announcements.description"),
      category: Symbol("announcements.category"),
      featured: Symbol("announcements.featured"),
      createdAt: Symbol("announcements.createdAt"),
      updatedAt: Symbol("announcements.updatedAt"),
    };

    const blogPosts = {
      slug: Symbol("blog.slug"),
      title: Symbol("blog.title"),
      description: Symbol("blog.description"),
      content: Symbol("blog.content"),
      date: Symbol("blog.date"),
      source: Symbol("blog.source"),
      sourceUrl: Symbol("blog.sourceUrl"),
      image: Symbol("blog.image"),
      published: Symbol("blog.published"),
      createdAt: Symbol("blog.createdAt"),
      updatedAt: Symbol("blog.updatedAt"),
    };

    const curatedFallbackRows = [
      {
        id: "curated-1",
        title: "Curated fallback",
        url: "https://example.com/curated",
        source: "Example",
        sourceImage: null,
        date: new Date("2026-04-08T00:00:00.000Z"),
        description: "Curated summary",
        category: "ai",
        featured: false,
        createdAt: new Date("2026-04-08T00:00:00.000Z"),
        updatedAt: new Date("2026-04-08T00:00:00.000Z"),
      },
    ];

    const announcementFallbackRows = [
      {
        id: "announcement-1",
        title: "Announcement fallback",
        url: "https://example.com/announcement",
        company: "Example Co",
        companyLogo: null,
        platform: "x",
        date: new Date("2026-04-08T00:00:00.000Z"),
        description: "Announcement summary",
        category: "product",
        featured: true,
        createdAt: new Date("2026-04-08T00:00:00.000Z"),
        updatedAt: new Date("2026-04-08T00:00:00.000Z"),
      },
    ];

    const blogFallbackRows = [
      {
        slug: "fallback-post",
        title: "Fallback post",
        description: "Blog summary",
        content: "Hello world",
        date: new Date("2026-04-08T00:00:00.000Z"),
        source: null,
        sourceUrl: null,
        image: null,
        published: true,
        createdAt: new Date("2026-04-08T00:00:00.000Z"),
        updatedAt: new Date("2026-04-08T00:00:00.000Z"),
      },
    ];

    const db = {
      select: (selection?: Record<string, unknown>) => ({
        from: (table: unknown) => {
          if (table === blogPosts) {
            return {
              where: () => ({
                limit: async () => {
                  if (!selection) {
                    throw createMissingRelevanceError("blog_posts");
                  }

                  return blogFallbackRows.slice(0, 1);
                },
                orderBy: async () => {
                  if (!selection) {
                    throw createMissingRelevanceError("blog_posts");
                  }

                  return blogFallbackRows;
                },
              }),
              orderBy: async () => {
                if (!selection) {
                  throw createMissingRelevanceError("blog_posts");
                }

                return blogFallbackRows;
              },
              limit: async () => {
                if (!selection) {
                  throw createMissingRelevanceError("blog_posts");
                }

                return blogFallbackRows.slice(0, 1);
              },
            };
          }

          const fallbackRows =
            table === curatedLinks ? curatedFallbackRows : announcementFallbackRows;
          const tableName = table === curatedLinks ? "curated_links" : "announcements";

          const makeListChain = () => ({
            limit: () => ({
              offset: async () => {
                if (!selection) {
                  throw createMissingRelevanceError(tableName);
                }

                return fallbackRows;
              },
            }),
          });

          return {
            where: () => ({
              orderBy: makeListChain,
              limit: async () => {
                if (!selection) {
                  throw createMissingRelevanceError(tableName);
                }

                return fallbackRows.slice(0, 1);
              },
            }),
            orderBy: makeListChain,
          };
        },
      }),
    };

    mock.module("@/db", () => ({
      ...dbTableExportPlaceholders,
      db,
      curatedLinks,
      announcements,
      blogPosts,
    }));

    const compat = await import(`../src/lib/editorial-read-compat?compat=${Date.now()}`);

    const curated = await compat.listCuratedLinksCompat({ limit: 10, offset: 0 });
    const announcementsList = await compat.listAnnouncementsCompat({ limit: 10, offset: 0 });
    const posts = await compat.listBlogPostsCompat(true);
    const curatedById = await compat.getCuratedLinkByIdCompat("curated-1");
    const announcementById = await compat.getAnnouncementByIdCompat("announcement-1");
    const postBySlug = await compat.getBlogPostBySlugCompat("fallback-post");

    expect(curated[0]).toMatchObject({ id: "curated-1", relevance: 5 });
    expect(announcementsList[0]).toMatchObject({ id: "announcement-1", relevance: 5 });
    expect(posts[0]).toMatchObject({ slug: "fallback-post", relevance: 5 });
    expect(curatedById).toMatchObject({ id: "curated-1", relevance: 5 });
    expect(announcementById).toMatchObject({ id: "announcement-1", relevance: 5 });
    expect(postBySlug).toMatchObject({ slug: "fallback-post", relevance: 5 });
  });
});
