import { useState, useEffect, useCallback } from "react";
import type { Candidate, SkillTag } from "@/data/candidates";

interface UseHotCandidatesReturn {
	/** Set of candidate IDs that are currently "hot" based on analytics */
	dataHotCandidateIds: Set<string>;
	/** Whether the hot candidates data has finished loading */
	hotDataLoaded: boolean;
	/** Check if a candidate is hot (analytics-driven OR has hot skill tag) */
	isHotCandidate: (candidate: Candidate) => boolean;
	/** Check if a candidate has the TOP skill tag (for badge display) */
	hasTopTag: (candidate: Candidate) => boolean;
	/** Check if a candidate should show TOP card styling (waits for hot data to prevent flicker) */
	showTopCardStyle: (candidate: Candidate) => boolean;
}

/**
 * Hook to fetch and manage "hot" candidate status.
 *
 * Hot candidates are determined by:
 * 1. Analytics data from PostHog (candidates with high recent views)
 * 2. Explicit "hot" skill tag in the database
 *
 * This hook also manages TOP badge styling logic to prevent the purple→orange
 * flicker that would occur if we showed TOP styling before knowing if a
 * candidate is also HOT.
 */
export function useHotCandidates(): UseHotCandidatesReturn {
	const [dataHotCandidateIds, setDataHotCandidateIds] = useState<Set<string>>(new Set());
	const [hotDataLoaded, setHotDataLoaded] = useState(false);

	// Fetch data-driven hot candidates from analytics
	useEffect(() => {
		const controller = new AbortController();

		fetch("/api/hot-candidates", { signal: controller.signal })
			.then((res) => res.json())
			.then((data) => {
				if (data.hotCandidateIds) {
					setDataHotCandidateIds(new Set(data.hotCandidateIds));
				}
			})
			.catch((error) => {
				// Silently fail - hot candidates badge is non-critical
				// Only log if not aborted
				if (error.name !== "AbortError") {
					console.debug("Failed to fetch hot candidates:", error);
				}
			})
			.finally(() => {
				setHotDataLoaded(true);
			});

		return () => controller.abort();
	}, []);

	// Check if candidate is hot (data-driven OR has hot skill tag)
	const isHotCandidate = useCallback(
		(candidate: Candidate) =>
			dataHotCandidateIds.has(candidate.id) ||
			candidate.skills?.includes("hot" as SkillTag) === true,
		[dataHotCandidateIds]
	);

	// Check if candidate has TOP skill tag (for badge display)
	const hasTopTag = useCallback(
		(candidate: Candidate) =>
			candidate.skills?.includes("top" as SkillTag) === true,
		[]
	);

	// Check if candidate should show TOP card styling (background/border)
	// Wait for hot data to prevent purple→orange flicker
	const showTopCardStyle = useCallback(
		(candidate: Candidate) => {
			if (!hotDataLoaded) return false;
			if (!hasTopTag(candidate)) return false;
			return !isHotCandidate(candidate);
		},
		[hotDataLoaded, hasTopTag, isHotCandidate]
	);

	return {
		dataHotCandidateIds,
		hotDataLoaded,
		isHotCandidate,
		hasTopTag,
		showTopCardStyle,
	};
}
