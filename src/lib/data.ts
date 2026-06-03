import { db } from "@/db";
import {
  jobs as jobsTable,
  jobTags,
  jobRoles,
  investments as investmentsTable,
  candidates as candidatesTable,
  curatedLinks as curatedLinksTable,
  candidateRedirects,
} from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import type { Job, Company, RelationshipCategory, JobTag, JobTier } from "@/data/jobs";
import { normalizeJobTags } from "@/lib/job-tags";
import { getFeaturedPortfolioJobCompanies } from "@/lib/portfolio-jobs";
import { isMissingColumnError, isMissingRelationError } from "@/lib/db-schema-compat";
import type {
  Candidate,
  VisibilityMode,
  SkillTag,
  ExperienceLevel,
  AvailabilityStatus,
  RoleType,
  CandidateTier,
} from "@/data/candidates";
import type { CuratedLink } from "@/data/news";

// Fetch all jobs from database and transform to component format
export async function getJobsFromDB(): Promise<Job[]> {
  const dbJobs = await getJobRowsFromDB({ orderBy: "created" });
  const featuredPortfolioJobCompanies = await getFeaturedPortfolioJobCompanyNames();

  return dbJobs.map((job) => mapJobRowToJob(job, featuredPortfolioJobCompanies));
}

type JobRow = {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  link: string;
  location: string | null;
  remote: string | null;
  type: string | null;
  salary: string | null;
  department: string | null;
  tags: string[] | null;
  category: string;
  featured: boolean | null;
  description: string | null;
  companyWebsite: string | null;
  companyX: string | null;
  companyGithub: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type JobReadOptions = {
  company?: string | null;
  category?: string | null;
  featured?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: "created" | "featured";
};

type JobTagDefinitionRow = {
  id: string;
  slug: string;
  label: string;
  color: string | null;
  createdAt: Date;
};

type JobRoleDefinitionRow = {
  id: string;
  slug: string;
  label: string;
  createdAt: Date;
};

const optionalJobColumnFallbacks = {
  company_logo: "NULL",
  location: "NULL",
  remote: "NULL",
  type: "NULL",
  salary: "NULL",
  department: "NULL",
  tags: "ARRAY[]::text[]",
  featured: "FALSE",
  description: "NULL",
  company_website: "NULL",
  company_x: "NULL",
  company_github: "NULL",
  created_at: "NOW()",
  updated_at: "NOW()",
} as const;

const requiredJobColumns = ["id", "title", "company", "link", "category"] as const;

function mapJobRowToJob(
  job: JobRow,
  featuredPortfolioJobCompanies: Set<string> = new Set(),
): Job {
  const company: Company = {
    name: job.company,
    logo: job.companyLogo || undefined,
    website: job.companyWebsite || "",
    category: job.category as RelationshipCategory,
    x: job.companyX || undefined,
    github: job.companyGithub || undefined,
  };

  return {
    id: job.id,
    title: job.title,
    company,
    location: job.location || "",
    remote: job.remote === "Remote",
    type: job.type as Job["type"],
    department: job.department || undefined,
    salary: job.salary || undefined,
    link: job.link,
    featured: Boolean(job.featured) || featuredPortfolioJobCompanies.has(job.company),
    tags: normalizeJobTags(job.tags) as JobTag[],
    tier: 3 as JobTier, // Default tier
    description: job.description || undefined,
    createdAt: job.createdAt,
  };
}

async function getFeaturedPortfolioJobCompanyNames() {
  try {
    const featuredInvestments = await db
      .select({
        title: investmentsTable.title,
        featured: investmentsTable.featured,
      })
      .from(investmentsTable)
      .where(eq(investmentsTable.featured, true));

    return getFeaturedPortfolioJobCompanies(featuredInvestments);
  } catch (error) {
    if (
      isMissingRelationError(error, "investments") ||
      isMissingColumnError(error, "featured")
    ) {
      console.error(
        "[jobs-read-compat] investments featured state unavailable, using job flags only",
        error,
      );
      return new Set<string>();
    }

    throw error;
  }
}

export async function getJobRowsFromDB(options: JobReadOptions = {}): Promise<JobRow[]> {
  try {
    let query = db
      .select({
        id: jobsTable.id,
        title: jobsTable.title,
        company: jobsTable.company,
        companyLogo: jobsTable.companyLogo,
        link: jobsTable.link,
        location: jobsTable.location,
        remote: jobsTable.remote,
        type: jobsTable.type,
        salary: jobsTable.salary,
        department: jobsTable.department,
        tags: jobsTable.tags,
        category: jobsTable.category,
        featured: jobsTable.featured,
        description: jobsTable.description,
        companyWebsite: jobsTable.companyWebsite,
        companyX: jobsTable.companyX,
        companyGithub: jobsTable.companyGithub,
        createdAt: jobsTable.createdAt,
        updatedAt: jobsTable.updatedAt,
      })
      .from(jobsTable)
      .$dynamic();

    const filters = [];
    if (options.company) {
      filters.push(eq(jobsTable.company, options.company));
    }
    if (options.category) {
      filters.push(eq(jobsTable.category, options.category));
    }
    if (options.featured) {
      filters.push(eq(jobsTable.featured, true));
    }
    if (filters.length > 0) {
      query = query.where(filters.length === 1 ? filters[0] : sql`${sql.join(filters, sql` and `)}`);
    }

    query =
      options.orderBy === "featured"
        ? query.orderBy(desc(jobsTable.featured), desc(jobsTable.createdAt))
        : query.orderBy(desc(jobsTable.createdAt));

    if (typeof options.limit === "number") {
      query = query.limit(options.limit);
    }
    if (typeof options.offset === "number") {
      query = query.offset(options.offset);
    }

    return await query;
  } catch (error) {
    if (isJobsSchemaCompatibilityError(error)) {
      console.error("[jobs-read-compat] jobs schema drift detected, using compatibility fallback", error);
      return getJobRowsWithSchemaFallback(options);
    }

    throw error;
  }
}

export async function countJobRowsFromDB(options: Pick<JobReadOptions, "company" | "category" | "featured"> = {}) {
  try {
    const filters = [];
    if (options.company) {
      filters.push(eq(jobsTable.company, options.company));
    }
    if (options.category) {
      filters.push(eq(jobsTable.category, options.category));
    }
    if (options.featured) {
      filters.push(eq(jobsTable.featured, true));
    }

    let query = db.select({ count: sql<number>`count(*)::int` }).from(jobsTable).$dynamic();
    if (filters.length > 0) {
      query = query.where(filters.length === 1 ? filters[0] : sql`${sql.join(filters, sql` and `)}`);
    }

    const [result] = await query;
    return Number(result?.count ?? 0);
  } catch (error) {
    if (isJobsSchemaCompatibilityError(error)) {
      return countJobRowsWithSchemaFallback(options);
    }

    throw error;
  }
}

export async function getJobTagsWithFallback(): Promise<JobTagDefinitionRow[]> {
  try {
    return await db.select().from(jobTags).orderBy(asc(jobTags.label));
  } catch (error) {
    if (isMissingRelationError(error, "job_tags") || isMissingColumnError(error, "color")) {
      console.error("[jobs-read-compat] job_tags unavailable, using empty tag definitions", error);
      return [];
    }

    throw error;
  }
}

export async function getJobRolesWithFallback(): Promise<JobRoleDefinitionRow[]> {
  try {
    return await db.select().from(jobRoles).orderBy(asc(jobRoles.label));
  } catch (error) {
    if (isMissingRelationError(error, "job_roles")) {
      console.error("[jobs-read-compat] job_roles unavailable, using empty role definitions", error);
      return [];
    }

    throw error;
  }
}

function isJobsSchemaCompatibilityError(error: unknown) {
  return (
    isMissingRelationError(error, "jobs") ||
    isMissingColumnError(error, "company_logo") ||
    isMissingColumnError(error, "location") ||
    isMissingColumnError(error, "remote") ||
    isMissingColumnError(error, "type") ||
    isMissingColumnError(error, "salary") ||
    isMissingColumnError(error, "department") ||
    isMissingColumnError(error, "tags") ||
    isMissingColumnError(error, "featured") ||
    isMissingColumnError(error, "description") ||
    isMissingColumnError(error, "company_website") ||
    isMissingColumnError(error, "company_x") ||
    isMissingColumnError(error, "company_github") ||
    isMissingColumnError(error, "created_at") ||
    isMissingColumnError(error, "updated_at")
  );
}

async function getJobRowsWithSchemaFallback(options: JobReadOptions) {
  const availableColumns = await getTableColumns("jobs");
  if (!requiredJobColumns.every((column) => availableColumns.has(column))) {
    return [];
  }

  const rows = await db.execute<JobRow>(
    sql`
      select ${sql.join(jobSelectColumns(availableColumns), sql`, `)}
      from "jobs"
      ${jobWhereClause(availableColumns, options)}
      order by ${jobOrderBy(availableColumns, options.orderBy)}
      ${typeof options.limit === "number" ? sql`limit ${options.limit}` : sql``}
      ${typeof options.offset === "number" ? sql`offset ${options.offset}` : sql``}
    `
  );

  return Array.from(rows);
}

async function countJobRowsWithSchemaFallback(
  options: Pick<JobReadOptions, "company" | "category" | "featured">,
) {
  const availableColumns = await getTableColumns("jobs");
  if (!requiredJobColumns.every((column) => availableColumns.has(column))) {
    return 0;
  }

  const [result] = await db.execute<{ count: number }>(
    sql`
      select count(*)::int as "count"
      from "jobs"
      ${jobWhereClause(availableColumns, options)}
    `
  );

  return Number(result?.count ?? 0);
}

async function getTableColumns(tableName: string) {
  const rows = await db.execute<{ column_name: string }>(
    sql`
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = ${tableName}
    `
  );

  return new Set(Array.from(rows, (row) => row.column_name));
}

function selectColumn(
  availableColumns: Set<string>,
  columnName: string,
  alias: keyof JobRow,
  fallbackSql: string,
) {
  return availableColumns.has(columnName)
    ? sql.raw(`"${columnName}" as "${alias}"`)
    : sql.raw(`${fallbackSql} as "${alias}"`);
}

function jobSelectColumns(availableColumns: Set<string>) {
  return [
    selectColumn(availableColumns, "id", "id", "''"),
    selectColumn(availableColumns, "title", "title", "''"),
    selectColumn(availableColumns, "company", "company", "''"),
    selectColumn(availableColumns, "company_logo", "companyLogo", optionalJobColumnFallbacks.company_logo),
    selectColumn(availableColumns, "link", "link", "''"),
    selectColumn(availableColumns, "location", "location", optionalJobColumnFallbacks.location),
    selectColumn(availableColumns, "remote", "remote", optionalJobColumnFallbacks.remote),
    selectColumn(availableColumns, "type", "type", optionalJobColumnFallbacks.type),
    selectColumn(availableColumns, "salary", "salary", optionalJobColumnFallbacks.salary),
    selectColumn(availableColumns, "department", "department", optionalJobColumnFallbacks.department),
    selectColumn(availableColumns, "tags", "tags", optionalJobColumnFallbacks.tags),
    selectColumn(availableColumns, "category", "category", "'network'"),
    selectColumn(availableColumns, "featured", "featured", optionalJobColumnFallbacks.featured),
    selectColumn(availableColumns, "description", "description", optionalJobColumnFallbacks.description),
    selectColumn(availableColumns, "company_website", "companyWebsite", optionalJobColumnFallbacks.company_website),
    selectColumn(availableColumns, "company_x", "companyX", optionalJobColumnFallbacks.company_x),
    selectColumn(availableColumns, "company_github", "companyGithub", optionalJobColumnFallbacks.company_github),
    selectColumn(availableColumns, "created_at", "createdAt", optionalJobColumnFallbacks.created_at),
    selectColumn(availableColumns, "updated_at", "updatedAt", optionalJobColumnFallbacks.updated_at),
  ];
}

function jobWhereClause(
  availableColumns: Set<string>,
  options: Pick<JobReadOptions, "company" | "category" | "featured">,
) {
  const filters = [];
  if (options.company && availableColumns.has("company")) {
    filters.push(sql`"company" = ${options.company}`);
  }
  if (options.category && availableColumns.has("category")) {
    filters.push(sql`"category" = ${options.category}`);
  }
  if (options.featured && availableColumns.has("featured")) {
    filters.push(sql`"featured" = true`);
  }

  return filters.length > 0 ? sql`where ${sql.join(filters, sql` and `)}` : sql``;
}

function jobOrderBy(availableColumns: Set<string>, orderBy: JobReadOptions["orderBy"]) {
  if (orderBy === "featured" && availableColumns.has("featured") && availableColumns.has("created_at")) {
    return sql`"featured" desc, "created_at" desc`;
  }

  if (availableColumns.has("created_at")) {
    return sql`"created_at" desc`;
  }

  return sql`"id" asc`;
}

// Fetch all candidates from database and transform to component format
export async function getCandidatesFromDB(): Promise<Candidate[]> {
  const dbCandidates = await db.select().from(candidatesTable).orderBy(desc(candidatesTable.createdAt));

  return dbCandidates.map((candidate) => ({
    id: candidate.id,
    visibility: "public" as VisibilityMode,
    name: candidate.name,
    title: candidate.title || "",
    bio: candidate.summary || "",
    profileImage: candidate.image || undefined,
    skills: (candidate.skills || []) as SkillTag[],
    location: candidate.location || "",
    remote: true,
    experience: (candidate.experience || "3-5") as ExperienceLevel,
    availability: (candidate.availability || "looking") as AvailabilityStatus,
    preferredRoles: [],
    lookingFor: [] as RoleType[],
    socials: {
      x: candidate.x || undefined,
      github: candidate.github || undefined,
      linkedin: candidate.linkedin || undefined,
      email: candidate.email || undefined,
      website: candidate.website || undefined,
      telegram: candidate.telegram || undefined,
      cv: candidate.cv || undefined,
    },
    tier: 2 as CandidateTier,
    featured: candidate.featured || false,
    createdAt: candidate.createdAt,
  }));
}

// Fetch curated links from database
export async function getCuratedLinksFromDB(): Promise<CuratedLink[]> {
  const dbLinks = await db
    .select()
    .from(curatedLinksTable)
    .orderBy(
      desc(sql`date_trunc('day', ${curatedLinksTable.date})`),
      desc(curatedLinksTable.relevance),
      desc(curatedLinksTable.date)
    );

  return dbLinks.map((link) => ({
    id: link.id,
    type: "curated" as const,
    title: link.title,
    url: link.url,
    source: link.source,
    sourceImage: link.sourceImage || undefined,
    date: link.date.toISOString().split("T")[0],
    description: link.description || undefined,
    category: link.category as CuratedLink["category"],
    featured: link.featured || false,
  }));
}

// Get a single candidate by ID, with redirect support for old IDs
export async function getCandidateById(id: string) {
  let [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, id))
    .limit(1);

  // Check for redirect if not found
  if (!candidate) {
    const [redirect] = await db
      .select()
      .from(candidateRedirects)
      .where(eq(candidateRedirects.oldId, id))
      .limit(1);

    if (redirect) {
      [candidate] = await db
        .select()
        .from(candidatesTable)
        .where(eq(candidatesTable.id, redirect.newId))
        .limit(1);
    }
  }

  return candidate;
}

// Get a single job by ID
export async function getJobById(id: string) {
  const [job] = await db
    .select()
    .from(jobsTable)
    .where(eq(jobsTable.id, id))
    .limit(1);
  return job;
}

// Get the base URL for the current environment (handles Vercel preview deployments)
export function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "https://dcbuilder.dev";
}
