import { redirect } from "next/navigation";
import { getCandidateById } from "@/lib/data";

interface Props {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
	const { id } = await params;
	const candidate = await getCandidateById(id);

	if (!candidate) {
		return { title: "Candidate Not Found" };
	}

	return {
		title: `${candidate.name} | Candidates`,
		description: candidate.summary || `${candidate.name} - ${candidate.title || "Candidate"}`,
	};
}

export default async function CandidatePage({ params }: Props) {
	const { id } = await params;
	const candidate = await getCandidateById(id);

	if (!candidate) {
		redirect("/candidates");
	}

	// Redirect to candidates page with the candidate modal open
	redirect(`/candidates?candidate=${candidate.id}`);
}
