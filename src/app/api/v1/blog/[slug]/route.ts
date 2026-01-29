import { NextRequest, NextResponse } from "next/server";
import { db, blogPosts } from "@/db";
import { eq } from "drizzle-orm";
import { requireAuth, validateApiKey } from "@/lib/api-auth";

function isValidDate(dateStr: string): boolean {
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime());
}

// GET - Get single blog post with full content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Check if authenticated - if so, can view unpublished
    const auth = await validateApiKey(request, "admin:read");

    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: "Post not found", code: "NOT_FOUND" }, { status: 404 });
    }

    // If not authenticated and post is unpublished, return 404
    if (!auth.valid && !post.published) {
      return NextResponse.json({ error: "Post not found", code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        slug: post.slug,
        title: post.title,
        date: post.date?.toISOString().split("T")[0] || "",
        description: post.description || "",
        source: post.source,
        sourceUrl: post.sourceUrl,
        image: post.image,
        content: post.content,
        published: post.published,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (error) {
    console.error("[api/blog] Failed to get blog post:", error);
    return NextResponse.json(
      { error: "Failed to get blog post", code: "DB_QUERY_ERROR" },
      { status: 500 }
    );
  }
}

// PUT - Update blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

  const { slug } = await params;

  // Check if post exists first (before parsing body)
  let existingPost;
  try {
    const [existing] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Post not found", code: "NOT_FOUND" }, { status: 404 });
    }
    existingPost = existing;
  } catch (error) {
    console.error("[api/blog] Failed to check existing post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post", code: "DB_QUERY_ERROR" },
      { status: 500 }
    );
  }

  // Parse JSON body separately for better error handling
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body", code: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const { title, date, description, source, sourceUrl, image, content, newSlug, published } = body as {
    title?: string;
    date?: string;
    description?: string;
    source?: string;
    sourceUrl?: string;
    image?: string;
    content?: string;
    newSlug?: string;
    published?: boolean;
  };

  if (!title || !content) {
    console.warn("[api/blog] PUT validation failed:", { hasTitle: !!title, hasContent: !!content });
    return NextResponse.json(
      { error: "title and content are required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // Validate date format if provided
  if (date && !isValidDate(date)) {
    console.warn("[api/blog] Invalid date format:", { date });
    return NextResponse.json(
      { error: "Invalid date format", code: "INVALID_DATE" },
      { status: 400 }
    );
  }

  try {
    // Handle slug rename
    if (newSlug && newSlug !== slug) {
      // Validate new slug format
      if (!/^[a-z0-9-]+$/.test(newSlug)) {
        return NextResponse.json(
          { error: "Slug must contain only lowercase letters, numbers, and hyphens", code: "INVALID_SLUG" },
          { status: 400 }
        );
      }

      // Check if new slug already exists
      const [existingNew] = await db
        .select({ slug: blogPosts.slug })
        .from(blogPosts)
        .where(eq(blogPosts.slug, newSlug))
        .limit(1);

      if (existingNew) {
        return NextResponse.json(
          { error: "A post with the new slug already exists", code: "SLUG_EXISTS" },
          { status: 409 }
        );
      }

      // Use transaction for atomic delete + insert (prevents data loss)
      await db.transaction(async (tx) => {
        await tx.delete(blogPosts).where(eq(blogPosts.slug, slug));
        await tx.insert(blogPosts).values({
          slug: newSlug,
          title,
          description: description || null,
          content,
          date: date ? new Date(date) : existingPost.date,
          source: source || null,
          sourceUrl: sourceUrl || null,
          image: image || null,
          published: published ?? true,
          createdAt: existingPost.createdAt,
        });
      });

      return NextResponse.json({
        success: true,
        slug: newSlug,
        message: "Blog post updated and renamed successfully",
      });
    }

    // Update existing post
    await db
      .update(blogPosts)
      .set({
        title,
        description: description || null,
        content,
        date: date ? new Date(date) : undefined,
        source: source || null,
        sourceUrl: sourceUrl || null,
        image: image || null,
        published: published ?? true,
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.slug, slug));

    return NextResponse.json({
      success: true,
      slug,
      message: "Blog post updated successfully",
    });
  } catch (error) {
    console.error("[api/blog] Failed to update blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post", code: "DB_UPDATE_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE - Delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

  try {
    const { slug } = await params;

    // Check if post exists
    const [existing] = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Post not found", code: "NOT_FOUND" }, { status: 404 });
    }

    await db.delete(blogPosts).where(eq(blogPosts.slug, slug));

    return NextResponse.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    console.error("[api/blog] Failed to delete blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post", code: "DB_DELETE_ERROR" },
      { status: 500 }
    );
  }
}
