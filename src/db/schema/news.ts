import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// Curated links (news)
export const curatedLinks = pgTable(
  "curated_links",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text("title").notNull(),
    url: text("url").notNull(),
    source: text("source").notNull(), // e.g., "Vitalik Buterin", "Paradigm"
    sourceImage: text("source_image"), // Profile image URL for the source
    date: timestamp("date").notNull(),
    isFresh: boolean("is_fresh").default(false).notNull(),
    description: text("description"),
    category: text("category").notNull(), // crypto, ai, infrastructure, etc.
    featured: boolean("featured").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("curated_links_category_idx").on(table.category),
    index("curated_links_date_idx").on(table.date),
  ]
);

// Announcements (news)
export const announcements = pgTable(
  "announcements",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text("title").notNull(),
    url: text("url").notNull(),
    company: text("company").notNull(),
    companyLogo: text("company_logo"),
    platform: text("platform").notNull(), // x, blog, discord, github, other
    date: timestamp("date").notNull(),
    isFresh: boolean("is_fresh").default(false).notNull(),
    description: text("description"),
    category: text("category").notNull(),
    featured: boolean("featured").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("announcements_company_idx").on(table.company),
    index("announcements_date_idx").on(table.date),
  ]
);

export type CuratedLink = typeof curatedLinks.$inferSelect;
export type NewCuratedLink = typeof curatedLinks.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
