import { NextRequest, NextResponse } from "next/server";
import { db, blogPosts } from "@/db";
import { desc, eq } from "drizzle-orm";
import { requireAuth, validateApiKey } from "@/services/auth";

function isValidDate(dateStr: string): boolean {
  const parsed = new Date(dateStr);
  return !isNaN(parsed.getTime());
}

// GET - List all blog posts (published only for public, all for authenticated)
export async function GET(request: NextRequest) {
  try {
    // Check if authenticated - if so, show all posts including unpublished
    const auth = await validateApiKey(request, "admin:read");

    const query = auth.valid
      ? db.select().from(blogPosts).orderBy(desc(blogPosts.date))
      : db.select().from(blogPosts).where(eq(blogPosts.published, true)).orderBy(desc(blogPosts.date));

    const posts = await query;

    const data = posts.map((post) => ({
      slug: post.slug,
      title: post.title,
      date: post.date?.toISOString().split("T")[0] || "",
      description: post.description || "",
      source: post.source,
      sourceUrl: post.sourceUrl,
      image: post.image,
      published: post.published,
      wordCount: post.content.trim().split(/\s+/).length,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[api/blog] Failed to list blog posts:", error);
    return NextResponse.json(
      { error: "Failed to list blog posts", code: "DB_QUERY_ERROR" },
      { status: 500 }
    );
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

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

  const { slug, title, date, description, source, sourceUrl, image, content, published } = body as {
    slug?: string;
    title?: string;
    date?: string;
    description?: string;
    source?: string;
    sourceUrl?: string;
    image?: string;
    content?: string;
    published?: boolean;
  };

  // Validate required fields
  if (!slug || !title || !content) {
    console.warn("[api/blog] POST validation failed:", { hasSlug: !!slug, hasTitle: !!title, hasContent: !!content });
    return NextResponse.json(
      { error: "slug, title, and content are required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  // Validate slug format (alphanumeric, hyphens only)
  if (!/^[a-z0-9-]+$/.test(slug)) {
    console.warn("[api/blog] Invalid slug format:", { slug });
    return NextResponse.json(
      { error: "Slug must contain only lowercase letters, numbers, and hyphens", code: "INVALID_SLUG" },
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
    // Check if slug already exists
    const existing = await db
      .select({ slug: blogPosts.slug })
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A post with this slug already exists", code: "SLUG_EXISTS" },
        { status: 409 }
      );
    }

    // Insert into database
    await db.insert(blogPosts).values({
      slug,
      title,
      description: description || null,
      content,
      date: date ? new Date(date) : new Date(),
      source: source || null,
      sourceUrl: sourceUrl || null,
      image: image || null,
      published: published ?? true,
    });

    return NextResponse.json({
      success: true,
      slug,
      message: "Blog post created successfully",
    });
  } catch (error) {
    console.error("[api/blog] Failed to create blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post", code: "DB_INSERT_ERROR" },
      { status: 500 }
    );
  }
}
