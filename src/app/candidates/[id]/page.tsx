import { redirect } from "next/navigation";
import { db, candidates, candidateRedirects } from "@/db";
import { eq } from "drizzle-orm";

interface Props {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
	const { id } = await params;
	const candidate = await getCandidate(id);

	if (!candidate) {
		return { title: "Candidate Not Found" };
	}

	return {
		title: `${candidate.name} | Candidates`,
		description: candidate.summary || `${candidate.name} - ${candidate.title || "Candidate"}`,
	};
}

async function getCandidate(id: string) {
	let [candidate] = await db
		.select()
		.from(candidates)
		.where(eq(candidates.id, id))
		.limit(1);

	// Check for redirect if not found
	if (!candidate) {
		const [redirectEntry] = await db
			.select()
			.from(candidateRedirects)
			.where(eq(candidateRedirects.oldId, id))
			.limit(1);

		if (redirectEntry) {
			[candidate] = await db
				.select()
				.from(candidates)
				.where(eq(candidates.id, redirectEntry.newId))
				.limit(1);
		}
	}

	return candidate;
}

export default async function CandidatePage({ params }: Props) {
	const { id } = await params;
	const candidate = await getCandidate(id);

	if (!candidate) {
		redirect("/candidates");
	}

	// Redirect to candidates page with the candidate modal open
	redirect(`/candidates?candidate=${candidate.id}`);
}
