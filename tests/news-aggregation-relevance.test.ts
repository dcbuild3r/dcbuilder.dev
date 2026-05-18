import { afterEach, describe, expect, mock, test } from "bun:test";
import { dbTableExportPlaceholders } from "./helpers/db-module-mock";

function createMissingRelevanceError(tableName: string) {
  const error = new Error("Failed query");
  (error as Error & { cause?: Error }).cause = new Error(
    `column "${tableName}"."relevance" does not exist`
  );
  return error;
}

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
      newsSourceInvestments: null,
      investments: null,
      jobs: null,
    }));

    mock.module("@/db", () => ({
      ...dbTableExportPlaceholders,
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
      newsSourceInvestments: null,
      investments: null,
      jobs: null,
    }));

    mock.module("@/db", () => ({
      ...dbTableExportPlaceholders,
      db: {
        select: (selection?: Record<string, unknown>) => ({
          from: (table: { __table: string }) => ({
            orderBy: async () => {
              if (!selection) {
                throw createMissingRelevanceError(table.__table);
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
      newsSourceInvestments: null,
      investments: null,
      jobs: null,
    }));

    mock.module("@/db", () => ({
      ...dbTableExportPlaceholders,
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

  test("attaches portfolio company context from X source mappings", async () => {
    const curatedLinks = { __table: "curated_links" };
    const announcements = { __table: "announcements" };
    const newsSourceInvestments = {
      __table: "news_source_investments",
      sourceType: {},
      sourceValue: {},
      sourceKind: {},
      investmentId: {},
    };
    const investments = {
      __table: "investments",
      id: {},
      title: {},
      logo: {},
      website: {},
    };
    const jobs = {
      __table: "jobs",
      company: {},
    };

    mock.module("../src/lib/blog", () => ({
      getAllPosts: async () => [],
    }));

    mock.module("@/db/schema", () => ({
      curatedLinks,
      announcements,
      newsSourceInvestments,
      investments,
      jobs,
    }));

    mock.module("@/db", () => ({
      ...dbTableExportPlaceholders,
      db: {
        select: () => ({
          from: (table: { __table: string }) => {
            if (table.__table === "curated_links") {
              return {
                orderBy: async () => [
                  {
                    id: "benjamin-x",
                    title: "The Feature",
                    url: "https://x.com/benjamintfels/status/2056307684622696836",
                    source: "Benjamin Fels",
                    sourceImage: null,
                    date: new Date("2026-05-18T00:00:00.000Z"),
                    description: "Curated summary",
                    category: "ai",
                    featured: false,
                    relevance: 8,
                  },
                ],
              };
            }

            if (table.__table === "announcements") {
              return { orderBy: async () => [] };
            }

            if (table.__table === "news_source_investments") {
              return Promise.resolve([
                {
                  sourceType: "x_handle",
                  sourceValue: "benjamintfels",
                  sourceKind: "person",
                  investmentId: "octet-id",
                },
              ]);
            }

            if (table.__table === "investments") {
              return {
                where: async () => [
                  {
                    id: "octet-id",
                    title: "Octet",
                    logo: "https://r2.example/octet.svg",
                    website: "https://octetproof.com/",
                  },
                ],
              };
            }

            return {
              where: () => ({
                groupBy: async () => [{ company: "Octet", count: 2 }],
              }),
            };
          },
        }),
      },
    }));

    const { getAllNews } = await import(`../src/lib/news?news-portfolio=${Date.now()}`);
    const news = await getAllNews();

    expect(news).toHaveLength(1);
    expect(news[0].portfolioCompany).toEqual({
      title: "Octet",
      logo: "https://r2.example/octet.svg",
      website: "https://octetproof.com/",
      jobsUrl: "/jobs?company=Octet",
      jobCount: 2,
      sourceIsCompanyAccount: false,
    });
  });

  test("uses the starter Benjamin Fels mapping before the mapping table exists", async () => {
    const curatedLinks = { __table: "curated_links" };
    const announcements = { __table: "announcements" };
    const investments = {
      __table: "investments",
      id: {},
      title: {},
      logo: {},
      website: {},
    };
    const jobs = {
      __table: "jobs",
      company: {},
    };

    mock.module("../src/lib/blog", () => ({
      getAllPosts: async () => [],
    }));

    mock.module("@/db/schema", () => ({
      curatedLinks,
      announcements,
      newsSourceInvestments: null,
      investments,
      jobs,
    }));

    mock.module("@/db", () => ({
      ...dbTableExportPlaceholders,
      db: {
        select: () => ({
          from: (table: { __table: string }) => {
            if (table.__table === "curated_links") {
              return {
                orderBy: async () => [
                  {
                    id: "benjamin-x-starter",
                    title: "The Feature",
                    url: "https://x.com/benjamintfels/status/2056307684622696836",
                    source: "Benjamin Fels",
                    sourceImage: null,
                    date: new Date("2026-05-18T00:00:00.000Z"),
                    description: "Curated summary",
                    category: "ai",
                    featured: false,
                    relevance: 8,
                  },
                ],
              };
            }

            if (table.__table === "announcements") {
              return { orderBy: async () => [] };
            }

            if (table.__table === "investments") {
              return {
                where: async () => [
                  {
                    id: "octet-id",
                    title: "Octet",
                    logo: "https://r2.example/octet.svg",
                    website: "https://octetproof.com/",
                  },
                ],
              };
            }

            return {
              where: () => ({
                groupBy: async () => [{ company: "Octet", count: 3 }],
              }),
            };
          },
        }),
      },
    }));

    const { getAllNews } = await import(`../src/lib/news?news-portfolio-starter=${Date.now()}`);
    const news = await getAllNews();

    expect(news[0].portfolioCompany).toMatchObject({
      title: "Octet",
      logo: "https://r2.example/octet.svg",
      website: "https://octetproof.com/",
      jobsUrl: "/jobs?company=Octet",
      jobCount: 3,
      sourceIsCompanyAccount: false,
    });
  });

  test("marks mapped investment X accounts as company-account sources", async () => {
    const curatedLinks = { __table: "curated_links" };
    const announcements = { __table: "announcements" };
    const investments = {
      __table: "investments",
      id: {},
      title: {},
      logo: {},
      website: {},
    };
    const jobs = {
      __table: "jobs",
      company: {},
    };

    mock.module("../src/lib/blog", () => ({
      getAllPosts: async () => [],
    }));

    mock.module("@/db/schema", () => ({
      curatedLinks,
      announcements,
      newsSourceInvestments: null,
      investments,
      jobs,
    }));

    mock.module("@/db", () => ({
      ...dbTableExportPlaceholders,
      db: {
        select: () => ({
          from: (table: { __table: string }) => {
            if (table.__table === "curated_links") {
              return {
                orderBy: async () => [
                  {
                    id: "prime-intellect-x",
                    title: "Prime Intellect Lab exits beta",
                    url: "https://x.com/primeintellect/status/2051576508675350953",
                    source: "Prime Intellect",
                    sourceImage: null,
                    date: new Date("2026-05-07T00:00:00.000Z"),
                    description: "Curated summary",
                    category: "ai",
                    featured: false,
                    relevance: 8,
                  },
                ],
              };
            }

            if (table.__table === "announcements") {
              return { orderBy: async () => [] };
            }

            if (table.__table === "investments") {
              return {
                where: async () => [
                  {
                    id: "prime-intellect-id",
                    title: "Prime Intellect",
                    logo: "https://r2.example/prime-intellect.jpg",
                    website: "https://www.primeintellect.ai/",
                  },
                ],
              };
            }

            return {
              where: () => ({
                groupBy: async () => [{ company: "Prime Intellect", count: 4 }],
              }),
            };
          },
        }),
      },
    }));

    const { getAllNews } = await import(`../src/lib/news?news-portfolio-company-account=${Date.now()}`);
    const news = await getAllNews();

    expect(news[0].portfolioCompany).toMatchObject({
      title: "Prime Intellect",
      jobsUrl: "/jobs?company=Prime%20Intellect",
      jobCount: 4,
      sourceIsCompanyAccount: true,
    });
  });
});
