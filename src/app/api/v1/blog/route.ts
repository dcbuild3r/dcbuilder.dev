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

// GET - List all blog posts
export async function GET() {
  try {
    if (!fs.existsSync(BLOG_DIR)) {
      return NextResponse.json({ data: [] });
    }

    const files = fs.readdirSync(BLOG_DIR);
    const posts = files
      .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
      .map((file) => {
        const slug = file.replace(/\.mdx?$/, "");
        const filePath = path.join(BLOG_DIR, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const { data, content } = matter(fileContent);

        return {
          slug,
          title: data.title || slug,
          date: data.date || "",
          description: data.description || "",
          source: data.source || null,
          sourceUrl: data.sourceUrl || null,
          image: data.image || null,
          contentLength: content.length,
          wordCount: content.trim().split(/\s+/).length,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ data: posts });
  } catch (error) {
    console.error("Failed to list blog posts:", error);
    return NextResponse.json(
      { error: "Failed to list blog posts" },
      { status: 500 }
    );
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, title, date, description, source, sourceUrl, content } = body;

    if (!slug || !title || !content) {
      return NextResponse.json(
        { error: "slug, title, and content are required" },
        { status: 400 }
      );
    }

    // Validate slug format (alphanumeric, hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    // Check if file already exists
    const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
    const mdPath = path.join(BLOG_DIR, `${slug}.md`);
    if (fs.existsSync(mdxPath) || fs.existsSync(mdPath)) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 }
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

    // Ensure directory exists
    if (!fs.existsSync(BLOG_DIR)) {
      fs.mkdirSync(BLOG_DIR, { recursive: true });
    }

    // Write file
    fs.writeFileSync(mdxPath, fileContent, "utf-8");

    return NextResponse.json({
      success: true,
      slug,
      message: "Blog post created successfully",
    });
  } catch (error) {
    console.error("Failed to create blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
