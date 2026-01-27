"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Application error:", error);
	}, [error]);

	return (
		<div className="min-h-screen flex items-center justify-center px-6">
			<div className="text-center space-y-4 max-w-md">
				<h1 className="text-2xl font-bold">Something went wrong</h1>
				<p className="text-neutral-600 dark:text-neutral-400">
					We encountered an unexpected error. Please try again.
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
						href="/"
						className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
					>
						Go home
					</Link>
				</div>
			</div>
		</div>
	);
}
