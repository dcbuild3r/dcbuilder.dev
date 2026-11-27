import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";
import { formatBlogDate, getPublicAllPosts, getPublicPostBySlug } from "@/lib/blog";
import { withDataFallback } from "@/lib/resilient-data";
import { R2_PUBLIC_URL } from "@/services/r2";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { mdxComponents } from "@/components/MDXComponents";
import { ArticleAIContext } from "@/components/ArticleAIContext";
import remarkGfm from "remark-gfm";
import { SITE_URL } from "@/lib/site";
import { blogPostingJsonLd, JsonLd, pageMetadata, withImage } from "@/lib/seo";

// Force dynamic rendering since we need database access
export const dynamic = "force-dynamic";

interface Props {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
	const { slug } = await params;
	const post = await withDataFallback("blog.post-metadata", getPublicPostBySlug(slug), null);

	if (!post) {
		return { title: "Post Not Found", robots: { index: false, follow: false } };
	}

	const path = `/blog/${encodeURIComponent(post.slug)}`;
	const metadata = withImage(pageMetadata({
		title: post.title,
		description: post.description || undefined,
		path,
		type: "article",
		publishedTime: post.date,
	}), `${SITE_URL}${path}/opengraph-image`);

	return {
		...metadata,
		openGraph: {
			...metadata.openGraph,
			type: "article",
			modifiedTime: post.updatedAt,
			authors: [SITE_URL],
		},
		robots: { index: true, follow: true },
	};
}

export default async function BlogPostPage({ params }: Props) {
	const { slug } = await params;
	const post = await withDataFallback("blog.post", getPublicPostBySlug(slug), null);

	if (!post) {
		notFound();
	}

	const allPosts = await withDataFallback("blog.next", getPublicAllPosts(), null);
	const index = allPosts?.findIndex((p) => p.slug === slug) ?? -1;
	const nextPost = allPosts && index >= 0 ? allPosts[index + 1] : undefined;

	return (
		<article className="mx-auto max-w-[720px] px-6 pt-14 pb-24">
			<JsonLd data={blogPostingJsonLd(post)} />
			<Link href="/blog" className="inline-flex min-h-11 items-center text-[14.5px] text-muted hover:text-ink">
				← All posts
			</Link>

			<header className="mt-4">
				<p className="mb-4 font-mono text-sm text-muted">
					<time dateTime={post.date}>{formatBlogDate(post.date)}</time> · {post.readingTime} min read
				</p>
				<h1 className="text-[clamp(2rem,4.4vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.05em] text-ink">
					{post.title}
				</h1>
				{post.description && (
					<p className="mt-5 text-xl leading-normal text-body">{post.description}</p>
				)}
				{post.source && post.sourceUrl && (
					<p className="mt-4 text-sm text-muted">
						First published on{" "}
						<a
							href={post.sourceUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-accent underline underline-offset-4"
						>
							{post.source}
						</a>
					</p>
				)}
				<div className="mt-6 flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<Image
							src={`${R2_PUBLIC_URL}/dcbuilder.png`}
							alt=""
							width={96}
							height={96}
							className="size-12 rounded-full object-cover"
						/>
						<span className="text-[17px] font-semibold tracking-[-0.01em] text-ink">dcbuilder.eth</span>
					</div>
					<ArticleAIContext title={post.title} />
				</div>
			</header>

			<div className="prose-custom mt-6">
				<MDXRemote
					source={post.content}
					components={mdxComponents}
					options={{
						blockJS: true,
						mdxOptions: { remarkPlugins: [remarkGfm] },
					}}
				/>
			</div>

			<footer className="mt-16 flex flex-wrap gap-4 pt-8">
				{nextPost && (
					<Link
						href={`/blog/${nextPost.slug}`}
						className="flex flex-1 basis-[280px] flex-col gap-2 rounded-2xl border border-line bg-surface p-5"
					>
						<Eyebrow>Next post</Eyebrow>
						<span className="text-[17px] font-semibold leading-[1.3] tracking-[-0.015em] text-ink">
							{nextPost.title}
						</span>
					</Link>
				)}
				<Link
					href="/news"
					className="flex flex-1 basis-[280px] flex-col gap-2 rounded-2xl bg-accent-soft p-5"
				>
					<Eyebrow className="text-accent-ink">Newsletter</Eyebrow>
					<span className="text-[17px] font-semibold leading-[1.3] tracking-[-0.015em] text-ink">
						Get new posts and curated links by email ↗
					</span>
				</Link>
			</footer>
		</article>
	);
}
