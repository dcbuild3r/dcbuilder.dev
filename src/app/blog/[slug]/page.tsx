import { notFound } from "next/navigation";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Navbar } from "@/components/Navbar";
import { formatBlogDate, getPostBySlug } from "@/lib/blog";
import { mdxComponents } from "@/components/MDXComponents";

// Force dynamic rendering since we need database access
export const dynamic = "force-dynamic";

interface Props {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
	const { slug } = await params;
	const post = await getPostBySlug(slug);

	if (!post) {
		return { title: "Post Not Found" };
	}

	return {
		title: post.title,
		description: post.description,
	};
}

export default async function BlogPostPage({ params }: Props) {
	const { slug } = await params;
	const post = await getPostBySlug(slug);

	if (!post) {
		notFound();
	}

	return (
		<>
			<Navbar />
			<main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-[7.5vw] overflow-x-hidden">
				<article className="max-w-3xl mx-auto py-12">
					<Link
						href="/blog"
						className="text-neutral-500 hover:opacity-70 transition-opacity cursor-pointer mb-8 inline-block"
					>
						← Back to blog
					</Link>

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
						<MDXRemote source={post.content} components={mdxComponents} />
					</div>
				</article>
			</main>
		</>
	);
}
