import { afterEach, describe, expect, mock, test } from "bun:test";

const dbModulePath = new URL("../src/db/index.ts", import.meta.url).pathname;
const authModulePath = new URL("../src/services/auth.ts", import.meta.url).pathname;

async function installNewsRouteMocks() {
  const inserts: Array<{ table: string; values: Record<string, unknown> }> = [];
  const updates: Array<{ table: string; values: Record<string, unknown> }> = [];
  const actualDb = await import("../src/db");
  const actualAuth = await import("../src/services/auth");

  const tables = {
    curatedLinks: { id: "curated.id", date: "curated.date", category: "curated.category", featured: "curated.featured" },
    announcements: {
      id: "announcements.id",
      date: "announcements.date",
      company: "announcements.company",
      category: "announcements.category",
      featured: "announcements.featured",
    },
    blogPosts: {
      slug: "blog.slug",
      date: "blog.date",
      published: "blog.published",
      title: "blog.title",
    },
  };

  const db: Record<string, unknown> = {
    select: () => ({
      from: (table: unknown) => ({
        where: () => ({
          orderBy: async () => {
            if (table === tables.blogPosts) {
              return [
                {
                  slug: "editorial-post",
                  title: "Editorial post",
                  date: new Date("2026-04-08T00:00:00.000Z"),
                  description: "Post description",
                  source: null,
                  sourceUrl: null,
                  image: null,
                  content: "Hello world",
                  published: true,
                  relevance: 8,
                  createdAt: new Date("2026-04-08T00:00:00.000Z"),
                  updatedAt: new Date("2026-04-08T00:00:00.000Z"),
                },
              ];
            }
            return [];
          },
          limit: async () => {
            if (table === tables.blogPosts) {
              return [];
            }
            if (table === tables.announcements) {
              return [{ id: "ann_1", title: "Announcement", relevance: 7 }];
            }
            return [];
          },
        }),
        orderBy: async () => {
          if (table === tables.blogPosts) {
            return [
              {
                slug: "editorial-post",
                title: "Editorial post",
                date: new Date("2026-04-08T00:00:00.000Z"),
                description: "Post description",
                source: null,
                sourceUrl: null,
                image: null,
                content: "Hello world",
                published: true,
                relevance: 8,
                createdAt: new Date("2026-04-08T00:00:00.000Z"),
                updatedAt: new Date("2026-04-08T00:00:00.000Z"),
              },
            ];
          }
          return [];
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) => {
        const tableName = table === tables.curatedLinks
          ? "curated"
          : table === tables.announcements
            ? "announcements"
            : "blog";
        inserts.push({ table: tableName, values });
        return {
          returning: async () => [{ id: `${tableName}_1`, ...values }],
        };
      },
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, unknown>) => {
        const tableName = table === tables.announcements ? "announcements" : "unknown";
        updates.push({ table: tableName, values });
        return {
          where: () => ({
            returning: async () => [{ id: "ann_1", ...values }],
          }),
        };
      },
    }),
    transaction: async (fn: (tx: Record<string, unknown>) => Promise<unknown>) => fn(db),
  };

  const dbModule = () => ({
    ...actualDb,
    db,
    curatedLinks: tables.curatedLinks,
    NewCuratedLink: {},
    announcements: tables.announcements,
    NewAnnouncement: {},
    blogPosts: tables.blogPosts,
  });
  mock.module("@/db", dbModule);
  mock.module(dbModulePath, dbModule);

  const authModule = () => ({
    ...actualAuth,
    requireAuth: async () => ({ valid: true as const, keyId: "key_123", name: "Admin" }),
    validateApiKey: async () => ({ valid: true as const, keyId: "key_123", name: "Admin" }),
    parsePaginationParams: () => ({ limit: 50, offset: 0 }),
  });
  mock.module("@/services/auth", authModule);
  mock.module(authModulePath, authModule);

  return { inserts, updates };
}

describe("news relevance routes", () => {
  afterEach(() => {
    mock.restore();
  });

  test("rejects curated relevance outside the allowed editorial range", async () => {
    await installNewsRouteMocks();

    const { POST } = await import(`../src/app/api/v1/news/curated/route?curated-relevance=${Date.now()}`);
    const response = await POST(
      new Request("https://dcbuilder.dev/api/v1/news/curated", {
        method: "POST",
        body: JSON.stringify({
          title: "Too relevant",
          url: "https://example.com/story",
          source: "Example",
          date: "2026-04-08",
          category: "ai",
          relevance: 11,
        }),
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("relevance");
  });

  test("persists announcement relevance and exposes blog relevance in admin reads", async () => {
    const { inserts, updates } = await installNewsRouteMocks();

    const { PUT: updateAnnouncement } = await import(
      `../src/app/api/v1/news/announcements/[id]/route?announcement-relevance=${Date.now()}`
    );
    const announcementResponse = await updateAnnouncement(
      new Request("https://dcbuilder.dev/api/v1/news/announcements/ann_1", {
        method: "PUT",
        body: JSON.stringify({ relevance: 7 }),
      }) as never,
      { params: Promise.resolve({ id: "ann_1" }) }
    );

    const { POST: createBlog, GET: listBlog } = await import(
      `../src/app/api/v1/blog/route?blog-relevance=${Date.now()}`
    );
    const createBlogResponse = await createBlog(
      new Request("https://dcbuilder.dev/api/v1/blog", {
        method: "POST",
        body: JSON.stringify({
          slug: "editorial-post",
          title: "Editorial post",
          content: "Hello world",
          relevance: 8,
        }),
      }) as never
    );
    const listBlogResponse = await listBlog(
      new Request("https://dcbuilder.dev/api/v1/blog") as never
    );
    const listBody = await listBlogResponse.json();

    expect(announcementResponse.status).toBe(200);
    expect(createBlogResponse.status).toBe(200);
    expect(updates).toEqual([
      {
        table: "announcements",
        values: expect.objectContaining({ relevance: 7 }),
      },
    ]);
    expect(inserts).toEqual([
      {
        table: "blog",
        values: expect.objectContaining({ relevance: 8 }),
      },
    ]);
    expect(listBody.data[0].relevance).toBe(8);
  });
});
