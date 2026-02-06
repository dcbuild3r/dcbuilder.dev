import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function NotFound() {
	return (
		<>
			<Navbar />
			<main id="main-content" className="min-h-screen pt-24 px-6 flex items-center justify-center">
				<div className="text-center space-y-4">
					<h1 className="text-6xl font-bold">404</h1>
					<h2 className="text-2xl font-semibold">Page not found</h2>
					<p className="text-neutral-600 dark:text-neutral-400">
						The page you&apos;re looking for doesn&apos;t exist or has been
						moved.
					</p>
					<Link
						href="/"
						className="inline-block mt-4 px-6 py-2 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
					>
						Go home
					</Link>
				</div>
			</main>
		</>
	);
}
