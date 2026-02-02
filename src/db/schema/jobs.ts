import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// Jobs table
export const jobs = pgTable(
  "jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text("title").notNull(),
    company: text("company").notNull(),
    companyLogo: text("company_logo"),
    link: text("link").notNull(),
    location: text("location"),
    remote: text("remote"), // "Remote" | "Hybrid" | "On-site"
    type: text("type"), // "Full-time" | "Part-time" | "Contract"
    salary: text("salary"),
    department: text("department"),
    tags: text("tags").array(),
    category: text("category").notNull(), // "portfolio" | "network"
    featured: boolean("featured").default(false),
    description: text("description"),
    responsibilities: text("responsibilities").array(),
    qualifications: text("qualifications").array(),
    benefits: text("benefits").array(),
    companyWebsite: text("company_website"),
    companyX: text("company_x"),
    companyGithub: text("company_github"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("jobs_company_idx").on(table.company),
    index("jobs_category_idx").on(table.category),
    index("jobs_featured_idx").on(table.featured),
  ]
);

// Job tags (dynamic tag definitions)
export const jobTags = pgTable(
  "job_tags",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    slug: text("slug").notNull().unique(), // e.g., "ai", "design", "leadership"
    label: text("label").notNull(), // e.g., "AI", "Design", "Leadership"
    color: text("color"), // Optional color for the tag (hex or tailwind class)
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("job_tags_slug_idx").on(table.slug)]
);

// Job roles/departments (dynamic role definitions)
export const jobRoles = pgTable(
  "job_roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    slug: text("slug").notNull().unique(), // e.g., "engineering", "design", "product"
    label: text("label").notNull(), // e.g., "Engineering", "Design", "Product"
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("job_roles_slug_idx").on(table.slug)]
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export type JobTag = typeof jobTags.$inferSelect;
export type NewJobTag = typeof jobTags.$inferInsert;

export type JobRole = typeof jobRoles.$inferSelect;
export type NewJobRole = typeof jobRoles.$inferInsert;
