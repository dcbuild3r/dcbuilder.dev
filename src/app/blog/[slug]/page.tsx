import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Navbar } from "@/components/Navbar";
import { formatBlogDate, getPostBySlug } from "@/lib/blog";
import { mdxComponents } from "@/components/MDXComponents";
import { ArticleAIContext } from "@/components/ArticleAIContext";
import { withDataFallback } from "@/lib/resilient-data";
import remarkGfm from "remark-gfm";

// Force dynamic rendering since we need database access
export const dynamic = "force-dynamic";

interface Props {
	params: Promise<{ slug: string }>;
}

const siteUrl = "https://dcbuilder.dev";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const post = await withDataFallback("blog.post-metadata", getPostBySlug(slug), null);

	if (!post) {
		return { title: "Post Not Found", robots: { index: false, follow: false } };
	}

	const canonicalUrl = `/blog/${encodeURIComponent(post.slug)}`;
	const imageUrl = post.image || `${canonicalUrl}/opengraph-image`;

	return {
		title: post.title,
		description: post.description,
		alternates: { canonical: canonicalUrl },
		openGraph: {
			type: "article",
			url: canonicalUrl,
			title: post.title,
			description: post.description,
			siteName: "dcbuilder.eth",
			publishedTime: post.date,
			modifiedTime: post.updatedAt,
			authors: [siteUrl],
			images: [{ url: imageUrl, alt: post.title }],
		},
		twitter: {
			card: "summary_large_image",
			title: post.title,
			description: post.description,
			creator: "@dcbuilder",
			images: [imageUrl],
		},
		robots: { index: true, follow: true },
	};
}

export default async function BlogPostPage({ params }: Props) {
	const { slug } = await params;
	const post = await withDataFallback("blog.post", getPostBySlug(slug), null);

	if (!post) {
		notFound();
	}

	const canonicalUrl = `${siteUrl}/blog/${encodeURIComponent(post.slug)}`;
	const articleJsonLd = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
		headline: post.title,
		description: post.description,
		datePublished: post.date,
		dateModified: post.updatedAt,
		image: [post.image || `${canonicalUrl}/opengraph-image`],
		author: { "@type": "Person", name: "dcbuilder.eth", url: siteUrl },
		publisher: { "@type": "Person", name: "dcbuilder.eth", url: siteUrl },
		url: canonicalUrl,
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<Navbar />
			<main id="main-content" className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-[7.5vw] overflow-x-hidden">
				<article className="max-w-3xl mx-auto py-12">
					<div className="mb-8 flex items-center justify-between gap-4">
						<Link
							href="/blog"
							className="text-neutral-500 hover:opacity-70 transition-opacity cursor-pointer"
						>
							← Back to blog
						</Link>
						<ArticleAIContext title={post.title} />
					</div>

					<header className="mb-8">
						<div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-500">
							<time dateTime={post.date}>{formatBlogDate(post.date)}</time>
							{post.source && post.sourceUrl && (
								<>
									<span>·</span>
									<a
										href={post.sourceUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-red-500 hover:underline cursor-pointer"
									>
										{post.source}
									</a>
								</>
							)}
							<span>·</span>
							<span>{post.readingTime} min read</span>
						</div>
						<h1 className="text-4xl font-bold mt-2">{post.title}</h1>
						{post.description && (
							<p className="text-xl text-neutral-600 dark:text-neutral-400 mt-4">
								{post.description}
							</p>
						)}
					</header>

					<div className="prose-custom">
						<MDXRemote
							source={post.content}
							components={mdxComponents}
							options={{
								blockJS: true,
								mdxOptions: { remarkPlugins: [remarkGfm] },
							}}
						/>
					</div>
				</article>
			</main>
		</>
	);
}
