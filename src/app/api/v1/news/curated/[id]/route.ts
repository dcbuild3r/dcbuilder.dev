import { NextRequest } from "next/server";
import { db, curatedLinks } from "@/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

// GET /api/v1/news/curated/[id] - Get a curated link by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [link] = await db
      .select()
      .from(curatedLinks)
      .where(eq(curatedLinks.id, id))
      .limit(1);

    if (!link) {
      return Response.json({ error: "Curated link not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json({ data: link });
  } catch (error) {
    console.error("[api/news/curated] GET by ID failed:", { id, error });
    return Response.json(
      { error: "Failed to fetch curated link", code: "DB_QUERY_ERROR" },
      { status: 500 }
    );
  }
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
      return Response.json({ error: "Curated link not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json({ data: updated });
  } catch (error) {
    console.error("[api/news/curated] PUT failed:", { id, error });

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return Response.json(
        { error: "Update would create a duplicate", code: "DUPLICATE_KEY" },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to update curated link", code: "DB_UPDATE_ERROR" },
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
      return Response.json({ error: "Curated link not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("[api/news/curated] DELETE failed:", { id, error });
    return Response.json(
      { error: "Failed to delete curated link", code: "DB_DELETE_ERROR" },
      { status: 500 }
    );
  }
}
