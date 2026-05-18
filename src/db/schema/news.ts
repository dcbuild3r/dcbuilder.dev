import { pgTable, text, boolean, timestamp, index, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { investments } from "./investments";

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
    description: text("description"),
    category: text("category").notNull(), // crypto, ai, infrastructure, etc.
    featured: boolean("featured").default(false),
    relevance: integer("relevance").notNull().default(5),
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
    description: text("description"),
    category: text("category").notNull(),
    featured: boolean("featured").default(false),
    relevance: integer("relevance").notNull().default(5),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("announcements_company_idx").on(table.company),
    index("announcements_date_idx").on(table.date),
  ]
);

// Maps external news sources, such as X handles and blog hosts, to portfolio companies.
export const newsSourceInvestments = pgTable(
  "news_source_investments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    sourceType: text("source_type").notNull(), // x_handle, blog_host
    sourceValue: text("source_value").notNull(),
    sourceKind: text("source_kind").notNull().default("person"), // person, company
    investmentId: text("investment_id")
      .notNull()
      .references(() => investments.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("news_source_investments_source_unique").on(table.sourceType, table.sourceValue),
    index("news_source_investments_investment_idx").on(table.investmentId),
  ]
);

export type CuratedLink = typeof curatedLinks.$inferSelect;
export type NewCuratedLink = typeof curatedLinks.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export type NewsSourceInvestment = typeof newsSourceInvestments.$inferSelect;
export type NewNewsSourceInvestment = typeof newsSourceInvestments.$inferInsert;
