import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

// Validate API key for write operations
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  return apiKey === process.env.ADMIN_API_KEY;
}

// Find the file path for a slug (could be .md or .mdx)
function findPostFile(slug: string): string | null {
  const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
  const mdPath = path.join(BLOG_DIR, `${slug}.md`);

  if (fs.existsSync(mdxPath)) return mdxPath;
  if (fs.existsSync(mdPath)) return mdPath;
  return null;
}

// GET - Get single blog post with full content
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const filePath = findPostFile(slug);

    if (!filePath) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    return NextResponse.json({
      data: {
        slug,
        title: data.title || slug,
        date: data.date || "",
        description: data.description || "",
        source: data.source || null,
        sourceUrl: data.sourceUrl || null,
        image: data.image || null,
        content,
      },
    });
  } catch (error) {
    console.error("Failed to get blog post:", error);
    return NextResponse.json(
      { error: "Failed to get blog post" },
      { status: 500 }
    );
  }
}

// PUT - Update blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const filePath = findPostFile(slug);

    if (!filePath) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, date, description, source, sourceUrl, content, newSlug } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content are required" },
        { status: 400 }
      );
    }

    // Build frontmatter
    const frontmatter: Record<string, string> = {
      title,
      date: date || new Date().toISOString().split("T")[0],
      description: description || "",
    };
    if (source) frontmatter.source = source;
    if (sourceUrl) frontmatter.sourceUrl = sourceUrl;

    // Create file content
    const fileContent = matter.stringify(content, frontmatter);

    // Handle slug rename
    if (newSlug && newSlug !== slug) {
      // Validate new slug format
      if (!/^[a-z0-9-]+$/.test(newSlug)) {
        return NextResponse.json(
          { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
          { status: 400 }
        );
      }

      // Check if new slug already exists
      const newMdxPath = path.join(BLOG_DIR, `${newSlug}.mdx`);
      const newMdPath = path.join(BLOG_DIR, `${newSlug}.md`);
      if (fs.existsSync(newMdxPath) || fs.existsSync(newMdPath)) {
        return NextResponse.json(
          { error: "A post with the new slug already exists" },
          { status: 409 }
        );
      }

      // Write to new file and delete old
      fs.writeFileSync(newMdxPath, fileContent, "utf-8");
      fs.unlinkSync(filePath);

      return NextResponse.json({
        success: true,
        slug: newSlug,
        message: "Blog post updated and renamed successfully",
      });
    }

    // Write to existing file
    fs.writeFileSync(filePath, fileContent, "utf-8");

    return NextResponse.json({
      success: true,
      slug,
      message: "Blog post updated successfully",
    });
  } catch (error) {
    console.error("Failed to update blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

// DELETE - Delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const filePath = findPostFile(slug);

    if (!filePath) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    fs.unlinkSync(filePath);

    return NextResponse.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
