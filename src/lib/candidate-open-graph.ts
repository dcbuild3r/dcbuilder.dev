import { getCandidateById } from "@/lib/data";
import { withDataFallback } from "@/lib/resilient-data";

export type CandidateOpenGraphData = {
	id: string;
	name: string;
	title: string | null;
	summary: string | null;
	skills: string[];
	image: string | null;
	createdAt: Date | null;
};

const candidateOpenGraphFallbacks: Record<string, CandidateOpenGraphData> = {
	"atakan-yavuzarslan": {
		id: "atakan-yavuzarslan",
		name: "Atakan Yavuzarslan",
		title: "Web3 & AI Partnerships / BD Director",
		summary:
			"Partnerships and business development leader working across Web3, AI agents, and the Turkish crypto ecosystem.",
		skills: ["Web3", "DeFi", "AI Agents", "Agent Security", "x402"],
		image:
			"https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/images/695070cb-069a-46f0-aa0d-d34c94cb50bd.png",
		createdAt: new Date("2026-09-06T14:11:23.911Z"),
	},
};

export async function getCandidateOpenGraphData(
	id: string
): Promise<CandidateOpenGraphData | null> {
	const fallback = candidateOpenGraphFallbacks[id] ?? null;
	if (fallback) return fallback;

	const candidate = await withDataFallback(
		`candidate-opengraph.${id}`,
		getCandidateById(id).then((row) =>
			row
				? {
						id: row.id,
						name: row.name,
						title: row.title,
						summary: row.summary,
						skills: row.skills ?? [],
						image: row.image,
						createdAt: row.createdAt,
					}
				: null
		),
		null,
		{ timeoutMs: 1_500 }
	);

	return candidate;
}
