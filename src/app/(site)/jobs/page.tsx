import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cachePublicData } from "@/lib/public-cache";
import { withDataFallback } from "@/lib/resilient-data";
import { JobsGrid } from "@/components/JobsGrid";
import { getPublicJobsFromDB, getPublicJobById, getJobRolesWithFallback, getJobTagsWithFallback } from "@/lib/data";
import { JobsHelpText } from "@/components/jobs/JobsHelpText";
import { PageHeader } from "@/components/ui/PageHeader";
import { JOBS_PAGE } from "@/data/page-content";
import { pageMetadata, summarize, withImage } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

// Force dynamic rendering since we need database access
export const dynamic = "force-dynamic";

interface Props {
	searchParams: Promise<{ job?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
	const { job: jobId } = await searchParams;

	if (jobId) {
		const job = await withDataFallback("jobs.metadata", getPublicJobById(jobId), null);
		if (job) {
			const description = summarize(job.description || `${job.title} position at ${job.company}`);
			return withImage(
				pageMetadata({
					title: `${job.title} at ${job.company}`,
					description,
					path: `/jobs?job=${job.id}`,
				}),
				`${SITE_URL}/jobs/${job.id}/opengraph-image`,
			);
		}
	}

	return pageMetadata({
		title: "Jobs",
		description: "Job opportunities at companies in my network",
		path: "/jobs",
	});
}

function JobsGridFallback() {
	return (
		<div className="space-y-4">
			{[...Array(5)].map((_, i) => (
				<div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-2" />
			))}
		</div>
	);
}

async function getTagsAndRoles() {
	const [tags, roles] = await Promise.all([
		getJobTagsWithFallback(),
		getJobRolesWithFallback(),
	]);
	return { tags, roles };
}

const getPublicJobTaxonomy = cachePublicData(["job-taxonomy"], getTagsAndRoles, ["jobs"]);

export default async function Jobs() {
	const [jobs, { tags, roles }] = await Promise.all([
		withDataFallback("jobs.list", getPublicJobsFromDB(), null),
		withDataFallback("jobs.taxonomy", getPublicJobTaxonomy(), { tags: [], roles: [] }),
	]);

	return (
		<div className="mx-auto max-w-[1200px] px-6 pb-24 pt-[72px]">
			<PageHeader
				eyebrow={jobs ? `Jobs board · ${jobs.length} open ${jobs.length === 1 ? "role" : "roles"}` : "Jobs board"}
				title="Work with teams I believe in."
				lede={JOBS_PAGE.description}
				aside={
					<div className="flex flex-col items-start gap-3">
						{jobs && <p className="flex items-baseline gap-3">
							<span className="text-[clamp(3.5rem,7vw,5.5rem)] font-bold leading-[0.9] tracking-[-0.06em] text-ink">{jobs.length}</span>
							<span className="text-lg font-medium text-body">open {jobs.length === 1 ? "role" : "roles"}</span>
						</p>}
						<JobsHelpText />
					</div>
				}
			/>
			{jobs === null ? (
				<div role="alert" className="space-y-3 text-center text-muted">
					<p>Jobs are temporarily unavailable.</p>
					<Link href="/jobs?retry=1" className="inline-block text-accent underline">Try again</Link>
				</div>
			) : (
				<Suspense fallback={<JobsGridFallback />}>
					<JobsGrid jobs={jobs} tagDefinitions={tags} roleDefinitions={roles} />
				</Suspense>
			)}
		</div>
	);
}
