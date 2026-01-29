import { NextRequest } from "next/server";
import { db, jobs, NewJob } from "@/db";
import { eq, desc, and, SQL } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

// GET /api/v1/jobs - List jobs with optional filters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company = searchParams.get("company");
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const limit = parseInt(searchParams.get("limit") || "100");
  const offset = parseInt(searchParams.get("offset") || "0");

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
        { error: "Missing required fields: title, company, link, category" },
        { status: 400 }
      );
    }

    const [newJob] = await db.insert(jobs).values(body).returning();

    return Response.json({ data: newJob }, { status: 201 });
  } catch (error) {
    console.error("Failed to create job:", error);
    return Response.json({ error: "Failed to create job" }, { status: 500 });
  }
}
