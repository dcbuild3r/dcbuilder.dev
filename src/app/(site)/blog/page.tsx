import Link from "next/link";
import { formatBlogDate, getPublicAllPosts } from "@/lib/blog";
import { PageHeader } from "@/components/ui/PageHeader";
import { XIcon } from "@/components/ui/icons";
import { withDataFallback } from "@/lib/resilient-data";
import { pageMetadata } from "@/lib/seo";

const DESCRIPTION = "Thoughts on Ethereum, cryptography, and distributed systems.";

const SOURCE_STYLE: Record<string, string> = {
	X: "bg-inverse text-inverse-ink",
	Substack: "bg-[#ff6719] text-white",
	Mirror: "bg-[#007aff] text-white",
};

function SourceMark({ source }: { source: string }) {
	const style = SOURCE_STYLE[source];
	if (!style) {
		return <span className="rounded-full border border-line-strong px-2 py-0.5 text-xs text-body">First published on {source}</span>;
	}
	return (
		<span
			role="img"
			aria-label={`First published on ${source}`}
			className={`inline-flex size-6 items-center justify-center rounded-md ${style}`}
		>
			{source === "X" ? (
				<XIcon className="size-3" aria-hidden="true" />
			) : (
				<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
					<path d={source === "Substack" ? "M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" : "M5 22V10a7 7 0 0 1 14 0v12z"} />
				</svg>
			)}
		</span>
	);
}

export const metadata = pageMetadata({
	title: "Blog",
	description: DESCRIPTION,
	path: "/blog",
});

// Force dynamic rendering since we need database access
export const dynamic = "force-dynamic";

export default async function BlogPage() {
	const posts = await withDataFallback("blog.list", getPublicAllPosts(), null);

	return (
		<div className="mx-auto max-w-[960px] px-6 pt-[72px] pb-24">
			<PageHeader
				eyebrow={posts ? `Blog · ${posts.length} ${posts.length === 1 ? "post" : "posts"}` : "Blog"}
				title="Writing"
				lede={DESCRIPTION}
			/>

			{posts === null ? (
				<div className="space-y-3 text-muted">
					<p>Blog posts are temporarily unavailable.</p>
					<Link href="/blog?retry=1" className="inline-block text-ink underline">
						Try again
					</Link>
				</div>
			) : posts.length === 0 ? (
				<p className="text-muted">No posts yet. Check back soon!</p>
			) : (
				<div className="relative mt-7">
					<div
						aria-hidden="true"
						className="absolute top-3 bottom-3 left-[7px] w-0.5 rounded-sm bg-line sm:left-[155px]"
					/>
					{posts.map((post) => (
						<article
							key={post.slug}
							className="relative grid grid-cols-1 items-start py-[18px] pl-8 sm:grid-cols-[132px_48px_minmax(0,1fr)] sm:pl-0"
						>
							<time
								dateTime={post.date}
								className="pb-1.5 font-mono text-xs leading-[1.6] text-muted sm:pt-1.5 sm:pb-0 sm:text-right"
							>
								{formatBlogDate(post.date)}
							</time>
							<span
								aria-hidden="true"
								className="absolute top-[22px] left-0 size-4 rounded-full border-[3px] border-ground bg-ink shadow-[0_0_0_1px_var(--ink)] sm:static sm:mt-2 sm:justify-self-center"
							/>
							<div className="flex min-w-0 flex-wrap items-start gap-x-6 gap-y-3.5">
								{post.image && (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={post.image}
										alt=""
										className="aspect-[16/10] w-full shrink-0 rounded-2xl border border-line object-cover sm:h-[124px] sm:w-[200px] sm:aspect-auto"
									/>
								)}
								<div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
									<h2 className="text-[22px] font-semibold leading-tight tracking-[-0.025em] text-ink">
										<Link
											href={`/blog/${post.slug}`}
											className="after:absolute after:inset-0 hover:text-accent"
										>
											{post.title}
										</Link>
									</h2>
									<p className="text-[15px] leading-relaxed text-body">{post.description}</p>
									<div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
										<span>{post.readingTime} min read</span>
										{post.source &&
											(post.sourceUrl ? (
												<a
													href={post.sourceUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="relative z-10 inline-flex min-h-6 items-center hover:opacity-80"
												>
													<SourceMark source={post.source} />
												</a>
											) : (
												<SourceMark source={post.source} />
											))}
									</div>
								</div>
							</div>
						</article>
					))}
				</div>
			)}
		</div>
	);
}
