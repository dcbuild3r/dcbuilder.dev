"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function BlogPostError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Blog post error:", error);
	}, [error]);

	return (
		<>
			<Navbar />
			<main id="main-content" className="min-h-screen pt-24 px-6 flex items-center justify-center">
				<div className="text-center space-y-4 max-w-md">
					<h1 className="text-2xl font-bold">Unable to load article</h1>
					<p className="text-neutral-600 dark:text-neutral-400">
						There was an error loading this blog post. The content may be
						temporarily unavailable.
					</p>
					{error.digest && (
						<p className="text-sm text-neutral-500">Error ID: {error.digest}</p>
					)}
					<div className="flex gap-4 justify-center pt-4">
						<button
							onClick={reset}
							className="px-4 py-2 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
						>
							Try again
						</button>
						<Link
							href="/blog"
							className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
						>
							Back to blog
						</Link>
					</div>
				</div>
			</main>
		</>
	);
}
