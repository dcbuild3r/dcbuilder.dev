import {
  pgTable,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
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
    date: timestamp("date").notNull(),
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("blog_posts_date_idx").on(table.date),
    index("blog_posts_published_idx").on(table.published),
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

// Type exports for use in application code
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;

export type CuratedLink = typeof curatedLinks.$inferSelect;
export type NewCuratedLink = typeof curatedLinks.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export type Investment = typeof investments.$inferSelect;
export type NewInvestment = typeof investments.$inferInsert;

export type Affiliation = typeof affiliations.$inferSelect;
export type NewAffiliation = typeof affiliations.$inferInsert;

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;

export type JobTag = typeof jobTags.$inferSelect;
export type NewJobTag = typeof jobTags.$inferInsert;

export type JobRole = typeof jobRoles.$inferSelect;
export type NewJobRole = typeof jobRoles.$inferInsert;

export type InvestmentCategory = typeof investmentCategories.$inferSelect;
export type NewInvestmentCategory = typeof investmentCategories.$inferInsert;
