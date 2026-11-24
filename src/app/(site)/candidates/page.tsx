import { Metadata } from "next";
import { CandidatesGrid } from "@/components/CandidatesGrid";
import { CandidatesHeader } from "@/components/candidates/CandidatesHeader";
import { getPublicCandidatesFromDB } from "@/lib/data";
import { pageMetadata, summarize, withImage } from "@/lib/seo";
import { getCandidateOpenGraphData } from "@/lib/candidate-open-graph";
import { withDataFallback } from "@/lib/resilient-data";
import { SITE_URL } from "@/lib/site";

// Force dynamic rendering (uses useSearchParams in CandidatesGrid)
export const dynamic = "force-dynamic";

interface Props {
	searchParams: Promise<{ candidate?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
	const { candidate: candidateId } = await searchParams;

	if (candidateId) {
		const candidate = await getCandidateOpenGraphData(candidateId);
		if (candidate) {
			return withImage(
				pageMetadata({
					title: `${candidate.name} | Candidates`,
					description: summarize(candidate.summary || `${candidate.name} - ${candidate.title || "Candidate"}`),
					path: `/candidates?candidate=${candidate.id}`,
				}),
				`${SITE_URL}/candidates/${candidate.id}/opengraph-image`,
			);
		}
	}

	return pageMetadata({
		title: "Candidates",
		description: "Talented builders looking for new opportunities",
		path: "/candidates",
	});
}

export default async function Candidates() {
	const candidates = await withDataFallback("candidates.list", getPublicCandidatesFromDB(), []);
	const available = candidates.filter((c) => c.availability !== "not-looking").length;

	return (
		<div className="mx-auto max-w-[1200px] px-6 pt-[72px] pb-24">
			<CandidatesHeader count={available} />
			<CandidatesGrid candidates={candidates} />
		</div>
	);
}
