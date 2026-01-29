import { NextRequest } from "next/server";
import { db, investments } from "@/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

// GET /api/v1/investments/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [investment] = await db
    .select()
    .from(investments)
    .where(eq(investments.id, id))
    .limit(1);

  if (!investment) {
    return Response.json({ error: "Investment not found" }, { status: 404 });
  }

  return Response.json({ data: investment });
}

// PUT /api/v1/investments/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "investments:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const body = await request.json();

    // Filter out fields that shouldn't be updated directly
    const { id: _id, createdAt, updatedAt, ...updateData } = body;

    const [updated] = await db
      .update(investments)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(investments.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Investment not found" }, { status: 404 });
    }

    return Response.json({ data: updated });
  } catch (error) {
    console.error("Failed to update investment:", error);
    return Response.json(
      { error: "Failed to update investment" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/investments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "investments:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const [deleted] = await db
      .delete(investments)
      .where(eq(investments.id, id))
      .returning();

    if (!deleted) {
      return Response.json({ error: "Investment not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete investment:", error);
    return Response.json(
      { error: "Failed to delete investment" },
      { status: 500 }
    );
  }
}
