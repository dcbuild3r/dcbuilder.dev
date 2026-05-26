import { NextRequest } from "next/server";
import { db, jobs, NewJob } from "@/db";
import { requireAuth, parsePaginationParams } from "@/services/auth";
import { countJobRowsFromDB, getJobRowsFromDB } from "@/lib/data";

// GET /api/v1/jobs - List jobs with optional filters
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const company = searchParams.get("company");
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const { limit, offset } = parsePaginationParams(searchParams);

  try {
    const filters = {
      company,
      category,
      featured: featured === "true",
    };
    const [data, total] = await Promise.all([
      getJobRowsFromDB({
        ...filters,
        limit,
        offset,
        orderBy: "featured",
      }),
      countJobRowsFromDB(filters),
    ]);

    return Response.json({
      data,
      meta: {
        total,
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
