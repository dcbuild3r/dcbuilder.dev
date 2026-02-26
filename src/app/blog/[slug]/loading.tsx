import { Navbar } from "@/components/Navbar";

export default function Loading() {
	return (
		<>
			<Navbar />
			<main id="main-content" className="min-h-screen pt-24 px-[7.5vw]">
				<div className="max-w-3xl mx-auto py-12 animate-pulse space-y-4">
					<div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24" />
					<div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
					<div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
					<div className="space-y-3 pt-8">
						<div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
						<div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
						<div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-4/6" />
						<div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
						<div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/6" />
					</div>
				</div>
			</main>
		</>
	);
}
