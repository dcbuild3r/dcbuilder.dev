import { NextRequest } from "next/server";
import { db, curatedLinks } from "@/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

// GET /api/v1/news/curated/[id] - Get a curated link by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [link] = await db
    .select()
    .from(curatedLinks)
    .where(eq(curatedLinks.id, id))
    .limit(1);

  if (!link) {
    return Response.json({ error: "Curated link not found" }, { status: 404 });
  }

  return Response.json({ data: link });
}

// PUT /api/v1/news/curated/[id] - Update a curated link
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "news:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const body = await request.json();

    const [updated] = await db
      .update(curatedLinks)
      .set({
        ...body,
        date: body.date ? new Date(body.date) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(curatedLinks.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Curated link not found" }, { status: 404 });
    }

    return Response.json({ data: updated });
  } catch (error) {
    console.error("Failed to update curated link:", error);
    return Response.json(
      { error: "Failed to update curated link" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/news/curated/[id] - Delete a curated link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "news:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const [deleted] = await db
      .delete(curatedLinks)
      .where(eq(curatedLinks.id, id))
      .returning();

    if (!deleted) {
      return Response.json({ error: "Curated link not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete curated link:", error);
    return Response.json(
      { error: "Failed to delete curated link" },
      { status: 500 }
    );
  }
}
