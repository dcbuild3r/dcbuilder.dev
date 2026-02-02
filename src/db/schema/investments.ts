import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// Investment categories
export const INVESTMENT_CATEGORIES = [
  "Crypto",
  "AI",
  "DeFi",
  "MEV",
  "Privacy",
  "Health/Longevity",
  "Security",
  "L1",
  "L2",
  "Governance",
  "Agents",
  "Hardware",
  "Devtools",
  "Social",
  "Network States",
  "ZK",
] as const;
export type InvestmentCategoryLabel = (typeof INVESTMENT_CATEGORIES)[number];

// Investments table
export const investments = pgTable(
  "investments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text("title").notNull(),
    description: text("description"),
    imageUrl: text("image_url"), // website URL
    logo: text("logo"),
    tier: text("tier"), // 1, 2, 3, 4
    featured: boolean("featured").default(false),
    status: text("status").default("active"), // active, inactive, acquired
    categories: text("categories").array(), // Array of category tags
    website: text("website"),
    x: text("x"),
    github: text("github"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("investments_tier_idx").on(table.tier),
    index("investments_featured_idx").on(table.featured),
  ]
);

// Investment categories (dynamic category definitions)
export const investmentCategories = pgTable(
  "investment_categories",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    slug: text("slug").notNull().unique(),
    label: text("label").notNull(),
    color: text("color"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("investment_categories_slug_idx").on(table.slug)]
);

export type Investment = typeof investments.$inferSelect;
export type NewInvestment = typeof investments.$inferInsert;

export type InvestmentCategory = typeof investmentCategories.$inferSelect;
export type NewInvestmentCategory = typeof investmentCategories.$inferInsert;
