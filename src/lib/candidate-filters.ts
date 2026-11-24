import {
	tagLabels,
	type AvailabilityStatus,
	type Candidate,
	type ExperienceLevel,
	type RoleType,
	type SkillTag,
} from "@/data/candidates";

export type AvailabilityFilter = "all" | "active" | AvailabilityStatus;

export interface CandidateFilters {
	availability: AvailabilityFilter;
	experience: "all" | ExperienceLevel;
	role: "all" | RoleType;
	location: string;
	tags: SkillTag[];
	/** Raw search text; compared lowercase against the search index. */
	query: string;
}

export function getCandidateLocationParts(location: string): string[] {
	return location
		.split(/[\/()]| or /i)
		.map((part) => part.trim())
		.filter(Boolean);
}

export function getCandidateDisplayName(candidate: Candidate): string {
	return candidate.visibility === "anonymous"
		? candidate.anonymousAlias || "Anonymous"
		: candidate.name;
}

/** Lowercased searchable text per candidate id (name/alias, title, bio, location, skills). */
export function buildCandidateSearchIndex(candidates: Candidate[]): Map<string, string> {
	const index = new Map<string, string>();
	for (const candidate of candidates) {
		const tagText = candidate.skills?.map((t) => tagLabels[t]).join(" ") || "";
		index.set(
			candidate.id,
			[getCandidateDisplayName(candidate), candidate.title, candidate.bio, candidate.location, tagText]
				.filter(Boolean)
				.join(" ")
				.toLowerCase(),
		);
	}
	return index;
}

export function filterCandidates(
	candidates: Candidate[],
	filters: CandidateFilters,
	searchIndex: Map<string, string>,
): Candidate[] {
	const query = filters.query.toLowerCase();
	return candidates.filter((candidate) => {
		if (filters.availability === "active") {
			if (candidate.availability === "not-looking") return false;
		} else if (filters.availability !== "all" && candidate.availability !== filters.availability) {
			return false;
		}

		if (filters.experience !== "all" && candidate.experience !== filters.experience) return false;

		if (filters.role !== "all" && !candidate.lookingFor?.includes(filters.role)) return false;

		if (
			filters.location !== "all" &&
			!getCandidateLocationParts(candidate.location).includes(filters.location)
		) {
			return false;
		}

		// Candidate must have ALL selected tags
		if (
			filters.tags.length > 0 &&
			(!candidate.skills || !filters.tags.every((tag) => candidate.skills?.includes(tag)))
		) {
			return false;
		}

		if (query && !(searchIndex.get(candidate.id) || "").includes(query)) return false;

		return true;
	});
}
