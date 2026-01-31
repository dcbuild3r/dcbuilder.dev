import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { JobsGrid } from "@/components/JobsGrid";
import { getJobsFromDB } from "@/lib/data";
import { db, jobTags, jobRoles } from "@/db";
import { asc } from "drizzle-orm";

export const metadata = {
	title: "Jobs",
	description: "Job opportunities at companies in my network",
};

// Force dynamic rendering since we need database access
export const dynamic = "force-dynamic";

function JobsGridFallback() {
	return (
		<div className="space-y-4">
			{[...Array(5)].map((_, i) => (
				<div
					key={i}
					className="h-24 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
				/>
			))}
		</div>
	);
}

async function getTagsAndRoles() {
	const [tags, roles] = await Promise.all([
		db.select().from(jobTags).orderBy(asc(jobTags.label)),
		db.select().from(jobRoles).orderBy(asc(jobRoles.label)),
	]);
	return { tags, roles };
}

export default async function Jobs() {
	const [jobs, { tags, roles }] = await Promise.all([
		getJobsFromDB(),
		getTagsAndRoles(),
	]);

	return (
		<>
			<Navbar />
			<main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
				<div className="max-w-4xl mx-auto py-8 sm:py-12 space-y-6 sm:space-y-8">
					{/* Header */}
					<section className="text-center space-y-4">
						<h1 className="text-4xl font-bold">Jobs</h1>
						<p className="max-w-2xl mx-auto text-lg text-neutral-700 dark:text-neutral-300">
							Open positions at companies I&apos;ve invested in, advise,
							work with, or am friends with. These are teams I believe in
							building products that matter.
						</p>
						<p className="text-sm text-neutral-500 dark:text-neutral-400">
							Am I missing any job openings from these companies or are any no longer available? Please let me know on{" "}
							<a
								href="https://t.me/dcbuilder"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
							>
								Telegram
								<svg
									className="w-3.5 h-3.5"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
								</svg>
							</a>
						</p>
					</section>

					{/* Jobs Grid */}
					<Suspense fallback={<JobsGridFallback />}>
						<JobsGrid jobs={jobs} tagDefinitions={tags} roleDefinitions={roles} />
					</Suspense>
				</div>
			</main>
		</>
	);
}
