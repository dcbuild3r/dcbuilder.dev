import { afterEach, describe, expect, mock, test } from "bun:test";
import { dbTableExportPlaceholders } from "./helpers/db-module-mock";

function createMissingRelevanceError(tableName: string) {
  const error = new Error("Failed query");
  (error as Error & { cause?: Error }).cause = new Error(
    `column "${tableName}"."relevance" does not exist`
  );
  return error;
}

function createMissingNewsSourceInvestmentsError() {
  const error = new Error("Failed query") as Error & { cause?: Error; query?: string };
  error.cause = new Error('relation "news_source_investments" does not exist');
  error.query = 'select "source_type", "source_value", "source_kind" from "news_source_investments"';
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
      affiliations: null,
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
    const news = await getAllNews({ includeCompanyTimelineNews: true });

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

  test("excludes company timeline news from general news by default", async () => {
    const curatedLinks = { __table: "curated_links" };
    const announcements = { __table: "announcements" };

    mock.module("../src/lib/blog", () => ({
      getAllPosts: async () => [],
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
                return [];
              }

              return [
                {
                  id: "morpho-backfill",
                  title: "Morpho historical milestone",
                  url: "https://x.com/morpholabs/status/123",
                  company: "Morpho",
                  companyLogo: null,
                  platform: "x",
                  date: new Date("2025-11-17T00:00:00.000Z"),
                  description: "Historical company news",
                  category: "growth",
                  featured: false,
                  relevance: 6,
                  createdAt: new Date("2026-05-29T12:00:00.000Z"),
                },
                {
                  id: "dcbuilder-update",
                  title: "dcbuilder site update",
                  url: "https://dcbuilder.dev/news",
                  company: "dcbuilder",
                  companyLogo: null,
                  platform: "blog",
                  date: new Date("2026-05-20T00:00:00.000Z"),
                  description: "General site announcement",
                  category: "general",
                  featured: false,
                  relevance: 5,
                  createdAt: new Date("2026-05-29T13:00:00.000Z"),
                },
              ];
            },
          }),
        }),
      },
    }));

    const { getAllNews } = await import(`../src/lib/news?news-company-timeline=${Date.now()}`);
    const generalNews = await getAllNews();
    const timelineNews = await getAllNews({ includeCompanyTimelineNews: true });

    expect(generalNews.map((item: { id: string }) => item.id)).toEqual([
      "dcbuilder-update",
    ]);

    const morphoItem = timelineNews.find(
      (item: { id: string }) => item.id === "morpho-backfill"
    );
    expect(morphoItem).toMatchObject({
      date: "2025-11-17",
      postedAt: "2025-11-17T00:00:00.000Z",
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
      affiliations: null,
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
    const news = await getAllNews({ includeCompanyTimelineNews: true });

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
      affiliations: null,
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
      affiliations: null,
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
    const generalNews = await getAllNews();
    const news = await getAllNews({ includeCompanyTimelineNews: true });

    expect(generalNews).toHaveLength(0);
    expect(news).toHaveLength(1);
    expect(news[0].portfolioCompany).toEqual({
      title: "Octet",
      logo: "https://r2.example/octet.svg",
      website: "https://octetproof.com/",
      jobsUrl: "/jobs?company=Octet",
      jobCount: 2,
      sourceIsCompanyAccount: false,
    });
    expect(news[0].postedAt).toBe("2026-05-18T00:00:00.000Z");
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
      affiliations: null,
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

  test("uses starter mappings when the mapping table is missing in the database", async () => {
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
      affiliations: null,
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
                    id: "prime-intellect-x-missing-table",
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

            if (table.__table === "news_source_investments") {
              throw createMissingNewsSourceInvestmentsError();
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

    const { getAllNews } = await import(`../src/lib/news?news-portfolio-missing-table=${Date.now()}`);
    const generalNews = await getAllNews();
    const news = await getAllNews({ includeCompanyTimelineNews: true });

    expect(generalNews).toHaveLength(0);
    expect(news).toHaveLength(1);
    expect(news[0].portfolioCompany).toMatchObject({
      title: "Prime Intellect",
      logo: "https://r2.example/prime-intellect.jpg",
      website: "https://www.primeintellect.ai/",
      jobsUrl: "/jobs?company=Prime%20Intellect",
      jobCount: 4,
      sourceIsCompanyAccount: true,
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
      affiliations: null,
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

  test("keeps portfolio context when the grouped job count query falls back", async () => {
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
      affiliations: null,
      jobs,
    }));

    mock.module("@/db", () => ({
      ...dbTableExportPlaceholders,
      db: {
        select: (selection?: { count?: unknown }) => ({
          from: (table: { __table: string }) => {
            if (table.__table === "curated_links") {
              return {
                orderBy: async () => [
                  {
                    id: "prime-intellect-x-fallback",
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

            if (selection?.count) {
              return {
                where: () => ({
                  groupBy: async () => {
                    throw new Error("grouped count unavailable");
                  },
                }),
              };
            }

            return {
              where: async () => [
                { company: "Prime Intellect" },
                { company: "Prime Intellect" },
              ],
            };
          },
        }),
      },
    }));

    const { getAllNews } = await import(`../src/lib/news?news-portfolio-job-fallback=${Date.now()}`);
    const news = await getAllNews();

    expect(news[0].portfolioCompany).toMatchObject({
      title: "Prime Intellect",
      jobsUrl: "/jobs?company=Prime%20Intellect",
      jobCount: 2,
      sourceIsCompanyAccount: true,
    });
  });

  test("uses direct company mappings for job-only companies like World", async () => {
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
      affiliations: null,
      jobs,
    }));

    mock.module("@/db", () => ({
      ...dbTableExportPlaceholders,
      db: {
        select: (selection?: { count?: unknown }) => ({
          from: (table: { __table: string }) => {
            if (table.__table === "curated_links") {
              return {
                orderBy: async () => [
                  {
                    id: "world-x",
                    title: "World ID 4.0",
                    url: "https://x.com/worldnetwork/status/2045201131589218574",
                    source: "World",
                    sourceImage: null,
                    date: new Date("2026-04-17T00:00:00.000Z"),
                    description: "Curated summary",
                    category: "identity",
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
              return { where: async () => [] };
            }

            if (selection?.count) {
              return {
                where: () => ({
                  groupBy: async () => [{ company: "World", count: 78 }],
                }),
              };
            }

            return {
              where: async () => [{ company: "World" }],
            };
          },
        }),
      },
    }));

    const { getAllNews } = await import(`../src/lib/news?news-direct-company=${Date.now()}`);
    const news = await getAllNews();

    expect(news[0].portfolioCompany).toMatchObject({
      title: "World",
      logo: "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/world.png",
      website: "https://world.org/",
      jobsUrl: "/jobs?company=World",
      jobCount: 78,
      sourceIsCompanyAccount: true,
    });
  });

  test("attaches affiliation company context from X handles", async () => {
    const curatedLinks = { __table: "curated_links" };
    const announcements = { __table: "announcements" };
    const affiliations = {
      __table: "affiliations",
      title: {},
      logo: {},
      website: {},
      xHandles: {},
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
      newsSourceInvestments: null,
      investments,
      affiliations,
      jobs,
    }));

    mock.module("@/db", () => ({
      ...dbTableExportPlaceholders,
      db: {
        select: (selection?: { count?: unknown }) => ({
          from: (table: { __table: string }) => {
            if (table.__table === "curated_links") {
              return {
                orderBy: async () => [
                  {
                    id: "paris-2",
                    title: "Paris 2.0",
                    url: "https://x.com/bidhan/status/2060043273545429503",
                    source: "bidhan",
                    sourceImage: null,
                    date: new Date("2026-05-29T00:00:00.000Z"),
                    description: "**Bagel** releases Paris 2.0.",
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
              return { where: async () => [] };
            }

            if (table.__table === "affiliations") {
              return Promise.resolve([
                {
                  title: "Bagel",
                  logo: "https://r2.example/bagel.png",
                  website: "https://www.bagel.net/",
                  xHandles: ["@bidhan"],
                },
              ]);
            }

            if (selection?.count) {
              return {
                where: () => ({
                  groupBy: async () => [{ company: "Bagel", count: 2 }],
                }),
              };
            }

            return {
              where: async () => [{ company: "Bagel" }, { company: "Bagel" }],
            };
          },
        }),
      },
    }));

    const { getAllNews } = await import(`../src/lib/news?news-affiliation-context=${Date.now()}`);
    const news = await getAllNews();

    expect(news[0].portfolioCompany).toMatchObject({
      title: "Bagel",
      logo: "https://r2.example/bagel.png",
      website: "https://www.bagel.net/",
      jobsUrl: "/jobs?company=Bagel",
      jobCount: 2,
      sourceIsCompanyAccount: false,
    });
    expect(news[0].postedAt).toBe("2026-05-19T00:00:00.000Z");
  });
});
