import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core";

// Blog posts table
export const blogPosts = pgTable(
  "blog_posts",
  {
    slug: text("slug").primaryKey(), // URL slug, e.g., "my-blog-post"
    title: text("title").notNull(),
    description: text("description"),
    content: text("content").notNull(), // MDX content
    date: timestamp("date").notNull(),
    source: text("source"), // e.g., "mirror", "devpill"
    sourceUrl: text("source_url"), // Original URL if republished
    image: text("image"), // Featured image URL
    published: boolean("published").default(true),
    isFresh: boolean("is_fresh").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("blog_posts_date_idx").on(table.date),
    index("blog_posts_published_idx").on(table.published),
  ]
);

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
