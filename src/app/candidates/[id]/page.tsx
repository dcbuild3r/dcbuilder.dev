import { redirect } from "next/navigation";
import { getCandidateById, getBaseUrl } from "@/lib/data";
import { withDataFallback } from "@/lib/resilient-data";

interface Props {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
	const { id } = await params;
	const candidate = await withDataFallback(
		"candidate-detail.metadata",
		getCandidateById(id),
		null
	);

	if (!candidate) {
		return { title: "Candidate Not Found" };
	}

	const baseUrl = getBaseUrl();
	const description = candidate.summary || `${candidate.name} - ${candidate.title || "Candidate"}`;

	return {
		title: `${candidate.name} | Candidates`,
		description,
		openGraph: {
			title: `${candidate.name} | Candidates`,
			description,
			images: [`${baseUrl}/candidates/${candidate.id}/opengraph-image`],
		},
		twitter: {
			card: "summary_large_image",
			title: `${candidate.name} | Candidates`,
			description,
			images: [`${baseUrl}/candidates/${candidate.id}/opengraph-image`],
		},
	};
}

export default async function CandidatePage({ params }: Props) {
	const { id } = await params;
	const candidate = await withDataFallback(
		"candidate-detail.redirect",
		getCandidateById(id),
		null
	);

	if (!candidate) {
		redirect("/candidates");
	}

	// Redirect to candidates page with the candidate modal open
	redirect(`/candidates?candidate=${candidate.id}`);
}
