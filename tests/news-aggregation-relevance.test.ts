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
});
