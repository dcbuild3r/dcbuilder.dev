import { NextRequest } from "next/server";
import { db, affiliations } from "@/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

// GET /api/v1/affiliations/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [affiliation] = await db
    .select()
    .from(affiliations)
    .where(eq(affiliations.id, id))
    .limit(1);

  if (!affiliation) {
    return Response.json({ error: "Affiliation not found" }, { status: 404 });
  }

  return Response.json({ data: affiliation });
}

// PUT /api/v1/affiliations/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "affiliations:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const body = await request.json();

    // Filter out fields that shouldn't be updated directly
    const { id: _id, createdAt, updatedAt, ...updateData } = body;

    const [updated] = await db
      .update(affiliations)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(affiliations.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Affiliation not found" }, { status: 404 });
    }

    return Response.json({ data: updated });
  } catch (error) {
    console.error("Failed to update affiliation:", error);
    return Response.json(
      { error: "Failed to update affiliation" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/affiliations/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "affiliations:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const [deleted] = await db
      .delete(affiliations)
      .where(eq(affiliations.id, id))
      .returning();

    if (!deleted) {
      return Response.json({ error: "Affiliation not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete affiliation:", error);
    return Response.json(
      { error: "Failed to delete affiliation" },
      { status: 500 }
    );
  }
}
