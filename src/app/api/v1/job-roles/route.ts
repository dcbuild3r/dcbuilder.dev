import { NextRequest, NextResponse } from "next/server";
import { db, jobRoles } from "@/db";
import { eq, asc } from "drizzle-orm";
import { validateApiKey } from "@/lib/api-auth";

// GET all job roles
export async function GET() {
  try {
    const roles = await db.select().from(jobRoles).orderBy(asc(jobRoles.label));
    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching job roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch job roles" },
      { status: 500 }
    );
  }
}

// POST create a new job role
export async function POST(request: NextRequest) {
  const authError = await validateApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { slug, label } = body;

    if (!slug || !label) {
      return NextResponse.json(
        { error: "slug and label are required" },
        { status: 400 }
      );
    }

    // Normalize slug
    const normalizedSlug = slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const [role] = await db
      .insert(jobRoles)
      .values({ slug: normalizedSlug, label })
      .returning();

    return NextResponse.json(role, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating job role:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json(
        { error: "A role with this slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create job role" },
      { status: 500 }
    );
  }
}

// DELETE a job role
export async function DELETE(request: NextRequest) {
  const authError = await validateApiKey(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    await db.delete(jobRoles).where(eq(jobRoles.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job role:", error);
    return NextResponse.json(
      { error: "Failed to delete job role" },
      { status: 500 }
    );
  }
}

// PATCH update a job role
export async function PATCH(request: NextRequest) {
  const authError = await validateApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, slug, label } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const updates: Partial<{ slug: string; label: string }> = {};
    if (slug) updates.slug = slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (label) updates.label = label;

    const [role] = await db
      .update(jobRoles)
      .set(updates)
      .where(eq(jobRoles.id, id))
      .returning();

    return NextResponse.json(role);
  } catch (error) {
    console.error("Error updating job role:", error);
    return NextResponse.json(
      { error: "Failed to update job role" },
      { status: 500 }
    );
  }
}
