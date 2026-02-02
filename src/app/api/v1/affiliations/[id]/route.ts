import { NextRequest } from "next/server";
import { db, affiliations } from "@/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/services/auth";

// GET /api/v1/affiliations/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [affiliation] = await db
      .select()
      .from(affiliations)
      .where(eq(affiliations.id, id))
      .limit(1);

    if (!affiliation) {
      return Response.json({ error: "Affiliation not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json({ data: affiliation });
  } catch (error) {
    console.error("[api/affiliations] GET by ID failed:", { id, error });
    return Response.json(
      { error: "Failed to fetch affiliation", code: "DB_QUERY_ERROR" },
      { status: 500 }
    );
  }
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
    const updateData = { ...(body as Record<string, unknown>) };
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const [updated] = await db
      .update(affiliations)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(affiliations.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Affiliation not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json({ data: updated });
  } catch (error) {
    console.error("[api/affiliations] PUT failed:", { id, error });

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return Response.json(
        { error: "Update would create a duplicate", code: "DUPLICATE_KEY" },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to update affiliation", code: "DB_UPDATE_ERROR" },
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
      return Response.json({ error: "Affiliation not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("[api/affiliations] DELETE failed:", { id, error });

    if (error instanceof Error && error.message.includes("foreign key")) {
      return Response.json(
        { error: "Cannot delete affiliation with existing references", code: "FK_CONSTRAINT" },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to delete affiliation", code: "DB_DELETE_ERROR" },
      { status: 500 }
    );
  }
}
