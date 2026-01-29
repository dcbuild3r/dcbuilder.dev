import { NextRequest } from "next/server";
import { db, jobs, NewJob } from "@/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/jobs/:id - Get a single job
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const [job] = await db
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
    .where(eq(jobs.id, id))
    .limit(1);

  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  return Response.json({ data: job });
}

// PUT /api/v1/jobs/:id - Update a job
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request, "jobs:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<NewJob>;

    // Remove fields that shouldn't be updated directly
    const updateData = { ...(body as Record<string, unknown>) };
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const [updated] = await db
      .update(jobs)
      .set({ ...updateData, updatedAt: new Date() } as Partial<NewJob>)
      .where(eq(jobs.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    return Response.json({ data: updated });
  } catch (error) {
    console.error("Failed to update job:", error);
    return Response.json({ error: "Failed to update job" }, { status: 500 });
  }
}

// DELETE /api/v1/jobs/:id - Delete a job
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request, "jobs:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const [deleted] = await db
    .delete(jobs)
    .where(eq(jobs.id, id))
    .returning({ id: jobs.id });

  if (!deleted) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  return Response.json({ data: { deleted: true, id: deleted.id } });
}
