import { redirect } from "next/navigation";
import { getJobById, getBaseUrl } from "@/lib/data";

interface Props {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
	const { id } = await params;
	const job = await getJobById(id);

	if (!job) {
		return { title: "Job Not Found" };
	}

	const baseUrl = getBaseUrl();
	const description = job.description || `${job.title} position at ${job.company}`;

	return {
		title: `${job.title} at ${job.company} | Jobs`,
		description,
		openGraph: {
			title: `${job.title} at ${job.company} | Jobs`,
			description,
			images: [`${baseUrl}/jobs/${job.id}/opengraph-image`],
		},
		twitter: {
			card: "summary_large_image",
			title: `${job.title} at ${job.company} | Jobs`,
			description,
			images: [`${baseUrl}/jobs/${job.id}/opengraph-image`],
		},
	};
}

export default async function JobPage({ params }: Props) {
	const { id } = await params;
	const job = await getJobById(id);

	if (!job) {
		redirect("/jobs");
	}

	// Redirect to jobs page with the job modal open
	redirect(`/jobs?job=${job.id}`);
}
