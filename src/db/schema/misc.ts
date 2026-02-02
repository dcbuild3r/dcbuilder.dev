import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// Affiliations table
export const affiliations = pgTable(
  "affiliations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text("title").notNull(),
    role: text("role").notNull(),
    dateBegin: text("date_begin"),
    dateEnd: text("date_end"),
    description: text("description"),
    imageUrl: text("image_url"),
    logo: text("logo"),
    website: text("website"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("affiliations_title_idx").on(table.title)]
);

// API keys for authentication
export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(), // e.g., "Admin", "CLI"
    key: text("key").notNull().unique(),
    permissions: text("permissions").array(), // e.g., ["jobs:write", "candidates:read"]
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("api_keys_key_idx").on(table.key)]
);

export type Affiliation = typeof affiliations.$inferSelect;
export type NewAffiliation = typeof affiliations.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
