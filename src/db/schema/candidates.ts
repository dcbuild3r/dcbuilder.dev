import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// Candidates table
export const candidates = pgTable(
  "candidates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    title: text("title"),
    location: text("location"),
    summary: text("summary"),
    skills: text("skills").array(),
    experience: text("experience"),
    education: text("education"),
    image: text("image"),
    cv: text("cv"),
    featured: boolean("featured").default(false),
    available: boolean("available").default(true), // Legacy - kept for backwards compatibility
    availability: text("availability").default("looking"), // "looking" | "open" | "not-looking"
    email: text("email"),
    telegram: text("telegram"),
    calendly: text("calendly"),
    x: text("x"),
    github: text("github"),
    linkedin: text("linkedin"),
    website: text("website"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("candidates_featured_idx").on(table.featured),
    index("candidates_available_idx").on(table.available),
  ]
);

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
