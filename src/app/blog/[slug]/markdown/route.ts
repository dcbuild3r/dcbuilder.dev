import { getPostBySlug } from "@/lib/blog";
import { buildArticleMarkdown } from "@/lib/article-ai-context";

export const dynamic = "force-dynamic";

interface RouteContext {
	params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteContext) {
	const { slug } = await params;
	const post = await getPostBySlug(slug);

	if (!post) {
		return new Response("Article not found\n", {
			status: 404,
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	}

	const requestUrl = new URL(request.url);
	const canonicalUrl = `${requestUrl.origin}/blog/${encodeURIComponent(post.slug)}`;
	const markdown = buildArticleMarkdown({
		title: post.title,
		description: post.description,
		date: post.date,
		source: post.source,
		sourceUrl: post.sourceUrl,
		canonicalUrl,
		content: post.content,
	});
	const filename = post.slug.replace(/[^a-zA-Z0-9_-]/g, "-");

	return new Response(markdown, {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"Content-Disposition": `inline; filename="${filename}.md"`,
			"Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
			"X-Robots-Tag": "noindex",
		},
	});
}
