import { redirect } from "next/navigation";
import { getJobById } from "@/lib/data";

interface Props {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
	const { id } = await params;
	const job = await getJobById(id);

	if (!job) {
		return { title: "Job Not Found" };
	}

	return {
		title: `${job.title} at ${job.company} | Jobs`,
		description: job.description || `${job.title} position at ${job.company}`,
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
