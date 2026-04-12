import { afterEach, describe, expect, mock, test } from "bun:test";

describe("getAllNews relevance mapping", () => {
  afterEach(() => {
    mock.restore();
  });

  test("preserves editorial relevance across blog, curated, and announcement items", async () => {
    const curatedLinks = { __table: "curated_links" };
    const announcements = { __table: "announcements" };

    mock.module("../src/lib/blog", () => ({
      getAllPosts: async () => ([
        {
          slug: "high-signal-post",
          title: "High Signal Blog Post",
          date: "2026-04-09",
          description: "Blog summary",
          content: "word ".repeat(300),
          readingTime: 2,
          image: null,
          relevance: 8,
        },
      ]),
    }));

    mock.module("@/db/schema", () => ({
      curatedLinks,
      announcements,
    }));

    mock.module("@/db", () => ({
      db: {
        select: () => ({
          from: (table: { __table: string }) => ({
            orderBy: async () => {
              if (table.__table === "curated_links") {
                return [
                  {
                    id: "curated-1",
                    title: "Curated Link",
                    url: "https://example.com/curated",
                    source: "Example Source",
                    sourceImage: null,
                    date: new Date("2026-04-08T00:00:00.000Z"),
                    description: "Curated summary",
                    category: "ai",
                    featured: false,
                    relevance: 7,
                  },
                ];
              }

              return [
                {
                  id: "announcement-1",
                  title: "Announcement",
                  url: "https://example.com/announcement",
                  company: "Example Co",
                  companyLogo: null,
                  platform: "x",
                  date: new Date("2026-04-07T00:00:00.000Z"),
                  description: "Announcement summary",
                  category: "product",
                  featured: false,
                  relevance: 5,
                },
              ];
            },
          }),
        }),
      },
    }));

    const { getAllNews } = await import(`../src/lib/news?news-relevance=${Date.now()}`);
    const news = await getAllNews();

    expect(news).toHaveLength(3);
    expect(news[0]).toMatchObject({
      id: "blog-high-signal-post",
      relevance: 8,
    });
    expect(news[1]).toMatchObject({
      id: "curated-1",
      relevance: 7,
    });
    expect(news[2]).toMatchObject({
      id: "announcement-1",
      relevance: 5,
    });
  });

  test("falls back to default relevance when production tables are missing the relevance column", async () => {
    const curatedLinks = { __table: "curated_links" };
    const announcements = { __table: "announcements" };

    mock.module("../src/lib/blog", () => ({
      getAllPosts: async () => ([
        {
          slug: "existing-post",
          title: "Existing Post",
          date: "2026-04-09",
          description: "Blog summary",
          content: "word ".repeat(300),
          readingTime: 2,
          image: null,
          relevance: 9,
        },
      ]),
    }));

    mock.module("@/db/schema", () => ({
      curatedLinks,
      announcements,
    }));

    mock.module("@/db", () => ({
      db: {
        select: (selection?: Record<string, unknown>) => ({
          from: (table: { __table: string }) => ({
            orderBy: async () => {
              if (!selection) {
                throw new Error(`column "${table.__table}.relevance" does not exist`);
              }

              if (table.__table === "curated_links") {
                return [
                  {
                    id: "curated-fallback",
                    title: "Curated Fallback",
                    url: "https://example.com/curated-fallback",
                    source: "Example Source",
                    sourceImage: null,
                    date: new Date("2026-04-08T00:00:00.000Z"),
                    description: "Curated summary",
                    category: "ai",
                    featured: false,
                  },
                ];
              }

              return [
                {
                  id: "announcement-fallback",
                  title: "Announcement Fallback",
                  url: "https://example.com/announcement-fallback",
                  company: "Example Co",
                  companyLogo: null,
                  platform: "x",
                  date: new Date("2026-04-07T00:00:00.000Z"),
                  description: "Announcement summary",
                  category: "product",
                  featured: false,
                },
              ];
            },
          }),
        }),
      },
    }));

    const { getAllNews } = await import(`../src/lib/news?news-relevance-fallback=${Date.now()}`);
    const news = await getAllNews();

    expect(news).toHaveLength(3);
    expect(news.find((item: { id: string }) => item.id === "curated-fallback")).toMatchObject({
      relevance: 5,
    });
    expect(news.find((item: { id: string }) => item.id === "announcement-fallback")).toMatchObject({
      relevance: 5,
    });
    expect(news.find((item: { id: string }) => item.id === "blog-existing-post")).toMatchObject({
      relevance: 9,
    });
  });

  test("keeps rendering available sources when one news table is unavailable", async () => {
    const curatedLinks = { __table: "curated_links" };
    const announcements = { __table: "announcements" };

    mock.module("../src/lib/blog", () => ({
      getAllPosts: async () => ([
        {
          slug: "blog-still-visible",
          title: "Blog Still Visible",
          date: "2026-04-09",
          description: "Blog summary",
          content: "word ".repeat(300),
          readingTime: 2,
          image: null,
          relevance: 6,
        },
      ]),
    }));

    mock.module("@/db/schema", () => ({
      curatedLinks,
      announcements,
    }));

    mock.module("@/db", () => ({
      db: {
        select: () => ({
          from: (table: { __table: string }) => ({
            orderBy: async () => {
              if (table.__table === "curated_links") {
                return [
                  {
                    id: "curated-still-visible",
                    title: "Curated Still Visible",
                    url: "https://example.com/curated-still-visible",
                    source: "Example Source",
                    sourceImage: null,
                    date: new Date("2026-04-08T00:00:00.000Z"),
                    description: "Curated summary",
                    category: "ai",
                    featured: false,
                    relevance: 7,
                  },
                ];
              }

              throw new Error('relation "announcements" does not exist');
            },
          }),
        }),
      },
    }));

    const { getAllNews } = await import(`../src/lib/news?news-source-fallback=${Date.now()}`);
    const news = await getAllNews();

    expect(news).toHaveLength(2);
    expect(news.map((item: { id: string }) => item.id)).toEqual([
      "blog-blog-still-visible",
      "curated-still-visible",
    ]);
  });
});
