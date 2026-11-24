import { redirect } from "next/navigation";
import { getPublicCandidateById } from "@/lib/data";
import { getCandidateOpenGraphData } from "@/lib/candidate-open-graph";
import { withDataFallback } from "@/lib/resilient-data";
import { pageMetadata, summarize } from "@/lib/seo";

interface Props {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
	const { id } = await params;
	const candidate = await getCandidateOpenGraphData(id);

	if (!candidate) {
		return { title: "Candidate Not Found" };
	}

	return pageMetadata({
		title: `${candidate.name} | Candidates`,
		description: summarize(candidate.summary || `${candidate.name} - ${candidate.title || "Candidate"}`),
		path: `/candidates?candidate=${candidate.id}`,
	});
}

export default async function CandidatePage({ params }: Props) {
	const { id } = await params;
	const candidate = await withDataFallback("candidate-detail.redirect", getPublicCandidateById(id), null);

	if (!candidate) {
		redirect("/candidates");
	}

	// Redirect to candidates page with the candidate modal open
	redirect(`/candidates?candidate=${candidate.id}`);
}
