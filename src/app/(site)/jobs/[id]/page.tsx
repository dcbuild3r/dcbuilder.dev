import { redirect } from "next/navigation";
import { getPublicJobById } from "@/lib/data";
import { withDataFallback } from "@/lib/resilient-data";
import { pageMetadata, summarize, withImage } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

interface Props {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
	const { id } = await params;
	const job = await withDataFallback("job-detail.metadata", getPublicJobById(id), null);

	if (!job) {
		return { title: "Job Not Found" };
	}

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

export default async function JobPage({ params }: Props) {
	const { id } = await params;
	const job = await withDataFallback("job-detail.redirect", getPublicJobById(id), null);

	if (!job) {
		redirect("/jobs");
	}

	// Redirect to jobs page with the job modal open
	redirect(`/jobs?job=${job.id}`);
}
