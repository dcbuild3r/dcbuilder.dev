import { withDataFallback } from "@/lib/resilient-data";
import { formatBlogDate, getPublicPostBySlug } from "@/lib/blog";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Blog post";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const post = await withDataFallback("blog.og", getPublicPostBySlug(slug), null);
	return renderOg({
		kind: "post",
		title: post?.title || "Blog Post",
		description: post?.description || undefined,
		date: post?.date ? formatBlogDate(post.date) : "",
		readingMinutes: post?.readingTime,
	});
}
