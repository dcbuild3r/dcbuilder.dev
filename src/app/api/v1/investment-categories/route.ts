import { NextRequest, NextResponse } from "next/server";
import { db, investmentCategories } from "@/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "@/services/auth";

// GET all investment categories
export async function GET() {
  try {
    const categories = await db.select().from(investmentCategories).orderBy(asc(investmentCategories.label));
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching investment categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch investment categories" },
      { status: 500 }
    );
  }
}

// POST create a new investment category
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "investments:write");
  if (auth instanceof Response) return auth;

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

    const [category] = await db
      .insert(investmentCategories)
      .values({ slug: normalizedSlug, label, color })
      .returning();

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating investment category:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create investment category" },
      { status: 500 }
    );
  }
}

// DELETE an investment category
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request, "investments:write");
  if (auth instanceof Response) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    await db.delete(investmentCategories).where(eq(investmentCategories.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting investment category:", error);
    return NextResponse.json(
      { error: "Failed to delete investment category" },
      { status: 500 }
    );
  }
}

// PATCH update an investment category
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request, "investments:write");
  if (auth instanceof Response) return auth;

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

    const [category] = await db
      .update(investmentCategories)
      .set(updates)
      .where(eq(investmentCategories.id, id))
      .returning();

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error updating investment category:", error);
    return NextResponse.json(
      { error: "Failed to update investment category" },
      { status: 500 }
    );
  }
}
