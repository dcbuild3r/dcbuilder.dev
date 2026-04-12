import { afterEach, describe, expect, mock, test } from "bun:test";

describe("getAllPosts relevance fallback", () => {
  afterEach(() => {
    mock.restore();
  });

  test("falls back to default relevance when blog_posts.relevance is missing", async () => {
    const blogPosts = {
      __table: "blog_posts",
      published: Symbol("published"),
      date: Symbol("date"),
    };

    mock.module("@/db", () => ({
      db: {
        select: (selection?: Record<string, unknown>) => ({
          from: (table: { __table: string }) => ({
            where: () => ({
              orderBy: async () => {
                if (!selection) {
                  throw new Error(`column "${table.__table}.relevance" does not exist`);
                }

                return [
                  {
                    slug: "fallback-post",
                    title: "Fallback Post",
                    date: new Date("2026-04-10T00:00:00.000Z"),
                    description: "Fallback summary",
                    content: "word ".repeat(300),
                    source: null,
                    sourceUrl: null,
                    image: null,
                    published: true,
                  },
                ];
              },
            }),
          }),
        }),
      },
      blogPosts,
    }));

    const { getAllPosts } = await import(`../src/lib/blog?blog-relevance-fallback=${Date.now()}`);
    const posts = await getAllPosts();

    expect(posts).toEqual([
      {
        slug: "fallback-post",
        title: "Fallback Post",
        date: "2026-04-10",
        description: "Fallback summary",
        source: undefined,
        sourceUrl: undefined,
        readingTime: 2,
        image: undefined,
        relevance: 5,
      },
    ]);
  });
});
