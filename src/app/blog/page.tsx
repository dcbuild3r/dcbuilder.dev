import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
	title: "Blog",
	description: "Thoughts on Ethereum, cryptography, and distributed systems.",
};

export default function BlogPage() {
	const posts = getAllPosts();

	return (
		<>
			<Navbar />
			<main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
				<div className="max-w-3xl mx-auto py-8 sm:py-12">
					<h1 className="text-4xl font-bold mb-8">Blog</h1>

					{posts.length === 0 ? (
						<p className="text-neutral-600 dark:text-neutral-400">
							No posts yet. Check back soon!
						</p>
					) : (
						<div className="space-y-8">
							{posts.map((post) => (
								<article key={post.slug}>
									<div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-500">
										<time>
											{new Date(post.date).toLocaleDateString("en-US", {
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</time>
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
									<Link href={`/blog/${post.slug}`} className="block group cursor-pointer">
										<h2 className="text-2xl font-bold mt-1 mb-2 group-hover:scale-[1.02] origin-left transition-transform duration-150 cursor-pointer">
											{post.title}
										</h2>
										<p className="text-neutral-600 dark:text-neutral-400">
											{post.description}
										</p>
									</Link>
								</article>
							))}
						</div>
					)}
				</div>
			</main>
		</>
	);
}
