import { NextRequest } from "next/server";
import { db, candidates, NewCandidate } from "@/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/candidates/:id - Get a single candidate
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, id))
    .limit(1);

  if (!candidate) {
    return Response.json({ error: "Candidate not found" }, { status: 404 });
  }

  return Response.json({ data: candidate });
}

// PUT /api/v1/candidates/:id - Update a candidate
export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request, "candidates:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<NewCandidate>;

    // Remove fields that shouldn't be updated directly
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = body as Record<string, unknown>;

    const [updated] = await db
      .update(candidates)
      .set({ ...updateData, updatedAt: new Date() } as Partial<NewCandidate>)
      .where(eq(candidates.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Candidate not found" }, { status: 404 });
    }

    return Response.json({ data: updated });
  } catch (error) {
    console.error("Failed to update candidate:", error);
    return Response.json(
      { error: "Failed to update candidate" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/candidates/:id - Delete a candidate
export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAuth(request, "candidates:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  const [deleted] = await db
    .delete(candidates)
    .where(eq(candidates.id, id))
    .returning({ id: candidates.id });

  if (!deleted) {
    return Response.json({ error: "Candidate not found" }, { status: 404 });
  }

  return Response.json({ data: { deleted: true, id: deleted.id } });
}
