import { NextRequest, NextResponse } from "next/server";
import { db, jobTags } from "@/db";
import { eq, asc } from "drizzle-orm";
import { validateApiKey } from "@/lib/api-auth";

// GET all job tags
export async function GET() {
  try {
    const tags = await db.select().from(jobTags).orderBy(asc(jobTags.label));
    return NextResponse.json(tags);
  } catch (error) {
    console.error("Error fetching job tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch job tags" },
      { status: 500 }
    );
  }
}

// POST create a new job tag
export async function POST(request: NextRequest) {
  const authError = await validateApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { slug, label, color } = body;

    if (!slug || !label) {
      return NextResponse.json(
        { error: "slug and label are required" },
        { status: 400 }
      );
    }

    // Normalize slug
    const normalizedSlug = slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const [tag] = await db
      .insert(jobTags)
      .values({ slug: normalizedSlug, label, color })
      .returning();

    return NextResponse.json(tag, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating job tag:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json(
        { error: "A tag with this slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create job tag" },
      { status: 500 }
    );
  }
}

// DELETE a job tag
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

    await db.delete(jobTags).where(eq(jobTags.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job tag:", error);
    return NextResponse.json(
      { error: "Failed to delete job tag" },
      { status: 500 }
    );
  }
}

// PATCH update a job tag
export async function PATCH(request: NextRequest) {
  const authError = await validateApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { id, slug, label, color } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const updates: Partial<{ slug: string; label: string; color: string | null }> = {};
    if (slug) updates.slug = slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (label) updates.label = label;
    if (color !== undefined) updates.color = color;

    const [tag] = await db
      .update(jobTags)
      .set(updates)
      .where(eq(jobTags.id, id))
      .returning();

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error updating job tag:", error);
    return NextResponse.json(
      { error: "Failed to update job tag" },
      { status: 500 }
    );
  }
}
