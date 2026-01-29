import { NextRequest } from "next/server";
import { db, announcements } from "@/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

// GET /api/v1/news/announcements/[id] - Get an announcement by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [announcement] = await db
    .select()
    .from(announcements)
    .where(eq(announcements.id, id))
    .limit(1);

  if (!announcement) {
    return Response.json({ error: "Announcement not found" }, { status: 404 });
  }

  return Response.json({ data: announcement });
}

// PUT /api/v1/news/announcements/[id] - Update an announcement
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
      .update(announcements)
      .set({
        ...body,
        date: body.date ? new Date(body.date) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(announcements.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Announcement not found" }, { status: 404 });
    }

    return Response.json({ data: updated });
  } catch (error) {
    console.error("Failed to update announcement:", error);
    return Response.json(
      { error: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/news/announcements/[id] - Delete an announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request, "news:write");
  if (auth instanceof Response) return auth;

  const { id } = await params;

  try {
    const [deleted] = await db
      .delete(announcements)
      .where(eq(announcements.id, id))
      .returning();

    if (!deleted) {
      return Response.json({ error: "Announcement not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to delete announcement:", error);
    return Response.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
