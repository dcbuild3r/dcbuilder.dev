import { availabilityLabels } from "@/data/candidates";
import { getCandidateOpenGraphData } from "@/lib/candidate-open-graph";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";
import { isNew } from "@/lib/shuffle";

export const runtime = "nodejs";
export const alt = "Candidate";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const candidate = await getCandidateOpenGraphData(id);
	const skills = candidate?.skills ?? [];
	const has = (s: string) => skills.some((k) => k.toLowerCase() === s);
	const badges: string[] = [];
	if (has("hot")) badges.push("Hot");
	if (has("top")) badges.push("Top");
	if (isNew(candidate?.createdAt)) badges.push("New");

	// Only the two "available" states are worth advertising on a share card.
	const availability = candidate?.availability;
	const status = availability === "looking" || availability === "open" ? availabilityLabels[availability] : undefined;

	return renderOg({
		kind: "candidate",
		name: candidate?.name || "Candidate",
		title: candidate?.title || "",
		status,
		imageUrl: candidate?.image || undefined,
		meta: [candidate?.location, candidate?.experience].filter((v): v is string => !!v),
		skills: skills.filter((s) => !["hot", "top"].includes(s.toLowerCase())),
		badges,
	});
}
