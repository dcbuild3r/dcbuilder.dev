import { NextRequest } from "next/server";
import { db, announcements } from "@/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/services/auth";

// GET /api/v1/news/announcements/[id] - Get an announcement by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, id))
      .limit(1);

    if (!announcement) {
      return Response.json({ error: "Announcement not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json({ data: announcement });
  } catch (error) {
    console.error("[api/news/announcements] GET by ID failed:", { id, error });
    return Response.json(
      { error: "Failed to fetch announcement", code: "DB_QUERY_ERROR" },
      { status: 500 }
    );
  }
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

    // Only update allowed fields, explicitly handle timestamps
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.company !== undefined) updateData.company = body.company;
    if (body.companyLogo !== undefined) updateData.companyLogo = body.companyLogo;
    if (body.platform !== undefined) updateData.platform = body.platform;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.featured !== undefined) updateData.featured = body.featured;

    const [updated] = await db
      .update(announcements)
      .set(updateData)
      .where(eq(announcements.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Announcement not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json({ data: updated });
  } catch (error) {
    console.error("[api/news/announcements] PUT failed:", { id, error });

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return Response.json(
        { error: "Update would create a duplicate", code: "DUPLICATE_KEY" },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Failed to update announcement", code: "DB_UPDATE_ERROR" },
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
      return Response.json({ error: "Announcement not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("[api/news/announcements] DELETE failed:", { id, error });
    return Response.json(
      { error: "Failed to delete announcement", code: "DB_DELETE_ERROR" },
      { status: 500 }
    );
  }
}
