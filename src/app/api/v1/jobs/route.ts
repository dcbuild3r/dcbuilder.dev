import { NextRequest } from "next/server";
import { db, jobs, NewJob } from "@/db";
import { eq, desc, and, SQL } from "drizzle-orm";
import { requireAuth, parsePaginationParams } from "@/services/auth";

// GET /api/v1/jobs - List jobs with optional filters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company = searchParams.get("company");
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const includeTerminated = searchParams.get("includeTerminated");
  const { limit, offset } = parsePaginationParams(searchParams);

  try {
    const conditions: SQL[] = [];

    if (company) {
      conditions.push(eq(jobs.company, company));
    }
    if (category) {
      conditions.push(eq(jobs.category, category));
    }
    if (featured === "true") {
      conditions.push(eq(jobs.featured, true));
    }
    if (includeTerminated !== "true") {
      conditions.push(eq(jobs.terminated, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, countResult] = await Promise.all([
      db
        .select({
          id: jobs.id,
          title: jobs.title,
          company: jobs.company,
          companyLogo: jobs.companyLogo,
          link: jobs.link,
          location: jobs.location,
          remote: jobs.remote,
          type: jobs.type,
          salary: jobs.salary,
          department: jobs.department,
          tags: jobs.tags,
          category: jobs.category,
          featured: jobs.featured,
          description: jobs.description,
          companyWebsite: jobs.companyWebsite,
          companyX: jobs.companyX,
          companyGithub: jobs.companyGithub,
          sourceBoard: jobs.sourceBoard,
          sourceUrl: jobs.sourceUrl,
          sourceExternalId: jobs.sourceExternalId,
          lastCheckedAt: jobs.lastCheckedAt,
          terminated: jobs.terminated,
          terminatedAt: jobs.terminatedAt,
          terminationReason: jobs.terminationReason,
          createdAt: jobs.createdAt,
          updatedAt: jobs.updatedAt,
        })
        .from(jobs)
        .where(whereClause)
        .orderBy(desc(jobs.featured), desc(jobs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: jobs.id })
        .from(jobs)
        .where(whereClause),
    ]);

    return Response.json({
      data,
      meta: {
        total: countResult.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("[api/jobs] GET failed:", error);
    return Response.json(
      { error: "Failed to fetch jobs", code: "DB_QUERY_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/v1/jobs - Create a new job
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "jobs:write");
  if (auth instanceof Response) return auth;

  try {
    const body = (await request.json()) as NewJob;

    // Validate required fields
    if (!body.title || !body.company || !body.link || !body.category) {
      return Response.json(
        { error: "Missing required fields: title, company, link, category", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const [newJob] = await db.insert(jobs).values(body).returning();

    return Response.json({ data: newJob }, { status: 201 });
  } catch (error) {
    console.error("[api/jobs] POST failed:", error);

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return Response.json(
        { error: "A job with this identifier already exists", code: "DUPLICATE_KEY" },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to create job", code: "DB_INSERT_ERROR" },
      { status: 500 }
    );
  }
}
