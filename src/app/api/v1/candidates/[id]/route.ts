import { NextRequest } from "next/server";
import { db, candidates, NewCandidate } from "@/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/services/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/candidates/:id - Get a single candidate
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, id))
      .limit(1);

    if (!candidate) {
      return Response.json({ error: "Candidate not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json({ data: candidate });
  } catch (error) {
    console.error("[api/candidates] GET by ID failed:", { id, error });
    return Response.json(
      { error: "Failed to fetch candidate", code: "DB_QUERY_ERROR" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/candidates/:id - Update a candidate
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request, "candidates:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<NewCandidate>;

    // Remove fields that shouldn't be updated directly
    const updateData = { ...(body as Record<string, unknown>) };
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const [updated] = await db
      .update(candidates)
      .set({ ...updateData, updatedAt: new Date() } as Partial<NewCandidate>)
      .where(eq(candidates.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Candidate not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json({ data: updated });
  } catch (error) {
    console.error("[api/candidates] PUT failed:", { id, error });

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return Response.json(
        { error: "Update would create a duplicate", code: "DUPLICATE_KEY" },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to update candidate", code: "DB_UPDATE_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/candidates/:id - Delete a candidate
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request, "candidates:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const [deleted] = await db
      .delete(candidates)
      .where(eq(candidates.id, id))
      .returning({ id: candidates.id });

    if (!deleted) {
      return Response.json({ error: "Candidate not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json({ data: { deleted: true, id: deleted.id } });
  } catch (error) {
    console.error("[api/candidates] DELETE failed:", { id, error });

    if (error instanceof Error && error.message.includes("foreign key")) {
      return Response.json(
        { error: "Cannot delete candidate with existing references", code: "FK_CONSTRAINT" },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to delete candidate", code: "DB_DELETE_ERROR" },
      { status: 500 }
    );
  }
}
