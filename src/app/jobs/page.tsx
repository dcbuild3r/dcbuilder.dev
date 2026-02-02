import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { JobsGrid } from "@/components/JobsGrid";
import { getJobsFromDB } from "@/lib/data";
import { db, jobTags, jobRoles } from "@/db";
import { asc } from "drizzle-orm";
import { TelegramIcon } from "@/components/icons/TelegramIcon";
import { JOBS_PAGE } from "@/data/page-content";

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
						<h1 className="text-4xl font-bold">{JOBS_PAGE.title}</h1>
						<p className="max-w-2xl mx-auto text-lg text-neutral-700 dark:text-neutral-300">
							{JOBS_PAGE.description}
						</p>
						<p className="text-sm text-neutral-500 dark:text-neutral-400">
							{JOBS_PAGE.helpText}{" "}
							<a
								href={JOBS_PAGE.telegramUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
							>
								Telegram
								<TelegramIcon className="w-3.5 h-3.5" />
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
