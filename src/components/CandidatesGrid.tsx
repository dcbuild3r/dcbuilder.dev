"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, useRef, useCallback, useDeferredValue } from "react";
import { useSearchParams } from "next/navigation";
import type { Candidate, ExperienceLevel, SkillTag, RoleType } from "@/data/candidates";
import {
	trackCandidateView,
	trackCandidateCVClick,
	trackCandidateSocialClick,
	trackCandidateContactClick,
} from "@/lib/posthog";
import { sortCandidatesByVisibilityPriority } from "@/lib/candidate-sorting";
import {
	buildCandidateSearchIndex,
	filterCandidates,
	getCandidateLocationParts,
	type AvailabilityFilter,
} from "@/lib/candidate-filters";
import { useHotCandidates } from "@/hooks/useHotCandidates";
import { SpinnerIcon } from "./ui/icons";
import { CandidateCard } from "./candidates/CandidateCard";
import { CandidatesFilterBar } from "./candidates/CandidatesFilterBar";

const ExpandedCandidateView = dynamic(
	() => import("./ExpandedCandidateView").then((mod) => mod.ExpandedCandidateView),
	{ ssr: false }
);

interface CandidatesGridProps {
	candidates: Candidate[];
}

export function CandidatesGrid({ candidates }: CandidatesGridProps) {
	const searchParams = useSearchParams();
	const [availabilityFilter, setAvailabilityFilter] = useState<
		AvailabilityFilter
	>("active");
	const [experienceFilter, setExperienceFilter] = useState<
		"all" | ExperienceLevel
	>("all");
	const [roleFilter, setRoleFilter] = useState<"all" | RoleType>("all");
	const [selectedLocation, setSelectedLocation] = useState(
		searchParams.get("location") || "all"
	);
	const [selectedTags, setSelectedTags] = useState<SkillTag[]>([]);
	const [tagsExpanded, setTagsExpanded] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const deferredSearchQuery = useDeferredValue(searchQuery);
	const [displayCount, setDisplayCount] = useState(12);
	const [expandedCandidate, setExpandedCandidate] = useState<Candidate | null>(() => {
		const candidateId = searchParams.get("candidate");
		if (!candidateId) return null;
		return candidates.find((c) => c.id === candidateId) ?? null;
	});
	const loadMoreRef = useRef<HTMLDivElement>(null);

	// Use custom hook for hot candidates logic (better separation of concerns)
	const { isHotCandidate, hasTopTag, showTopCardStyle } = useHotCandidates();

	const replaceSearchParams = useCallback((nextParams: URLSearchParams) => {
		const currentUrl = new URL(window.location.href);
		const queryString = nextParams.toString();
		if (queryString === currentUrl.searchParams.toString()) return;
		window.history.replaceState(null, "", queryString ? `${currentUrl.pathname}?${queryString}` : currentUrl.pathname);
	}, []);

	const updateUrlParams = useCallback((updates: Record<string, string | null>) => {
		const nextParams = new URLSearchParams(window.location.search);
		Object.entries(updates).forEach(([key, value]) => {
			if (value === null || value === "") {
				nextParams.delete(key);
			} else {
				nextParams.set(key, value);
			}
		});
		replaceSearchParams(nextParams);
	}, [replaceSearchParams]);

	// Helper to build candidate event properties for analytics
	const getCandidateEventProps = useCallback((candidate: Candidate) => ({
		candidate_id: candidate.id,
		candidate_name: candidate.visibility === "anonymous"
			? candidate.anonymousAlias || "Anonymous"
			: candidate.name,
		candidate_title: candidate.title,
		is_featured: candidate.featured ?? false,
	}), []);

	// Sync URL with modal state
	const openCandidate = useCallback((candidate: Candidate) => {
		setExpandedCandidate(candidate);
		updateUrlParams({ candidate: candidate.id });
		trackCandidateView(getCandidateEventProps(candidate));
	}, [updateUrlParams, getCandidateEventProps]);

	const closeCandidate = useCallback(() => {
		setExpandedCandidate(null);
		updateUrlParams({ candidate: null });
	}, [updateUrlParams]);

	const handleLocationChange = useCallback((value: string) => {
		setSelectedLocation(value);
		updateUrlParams({ location: value === "all" ? null : value });
	}, [updateUrlParams]);

	// Infinite scroll: load more candidates when sentinel is visible
	useEffect(() => {
		const sentinel = loadMoreRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					setDisplayCount((prev) => prev + 12);
				}
			},
			{ rootMargin: "200px" } // Load before reaching the bottom
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, []);

	// Reset display count when filters change
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setDisplayCount(12);
	}, [availabilityFilter, experienceFilter, roleFilter, selectedLocation, searchQuery, selectedTags]);

	// Get all unique tags from candidates
	const allTags = useMemo(() => {
		const tags = new Set<SkillTag>();
		candidates.forEach((c) => c.skills?.forEach((tag) => tags.add(tag)));
		return Array.from(tags).sort();
	}, [candidates]);

	// Get all unique role types from candidates
	const allRoleTypes = useMemo(() => {
		const roles = new Set<RoleType>();
		candidates.forEach((c) => c.lookingFor?.forEach((role) => roles.add(role)));
		return Array.from(roles).sort();
	}, [candidates]);

	const allLocations = useMemo(() => {
		const locations = new Set<string>();
		candidates.forEach((candidate) => {
			getCandidateLocationParts(candidate.location).forEach((location) => {
				locations.add(location);
			});
		});
		return Array.from(locations).sort();
	}, [candidates]);

	const toggleTag = (tag: SkillTag) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
		);
	};

	const candidateSearchIndex = useMemo(() => buildCandidateSearchIndex(candidates), [candidates]);

	const filteredCandidates = useMemo(
		() =>
			filterCandidates(
				candidates,
				{
					availability: availabilityFilter,
					experience: experienceFilter,
					role: roleFilter,
					location: selectedLocation,
					tags: selectedTags,
					query: deferredSearchQuery,
				},
				candidateSearchIndex,
			),
		[
			candidates,
			availabilityFilter,
			experienceFilter,
			roleFilter,
			selectedLocation,
			deferredSearchQuery,
			selectedTags,
			candidateSearchIndex,
		],
	);

	// Include today's date so shuffle changes daily (stable after hydration)
	const [shuffleSeed] = useState(() => new Date().toISOString().split("T")[0]);

	const filterKey = useMemo(
		() =>
			[
					availabilityFilter,
					experienceFilter,
					roleFilter,
					selectedLocation,
					deferredSearchQuery,
					selectedTags.join(","),
					shuffleSeed,
				].join("|"),
		[availabilityFilter, experienceFilter, roleFilter, selectedLocation, deferredSearchQuery, selectedTags, shuffleSeed]
	);

	// Deterministic shuffle: featured+hot, featured, hot, top, verified, then unverified
	const sortedCandidates = useMemo(() => {
		return sortCandidatesByVisibilityPriority(filteredCandidates, {
			filterKey,
			isHotCandidate,
			hasTopTag,
		});
	}, [filteredCandidates, filterKey, isHotCandidate, hasTopTag]);

	const candidatesToDisplay = sortedCandidates;

	// Limit display based on infinite scroll count
	const displayedCandidates = candidatesToDisplay.slice(0, displayCount);
	const hasMore = candidatesToDisplay.length > displayCount;

	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setHydrated(true);
	}, []);

	return (
		<div
			className="space-y-6"
			data-testid="candidates-grid"
			data-hydrated={hydrated}
		>
			<CandidatesFilterBar
				availability={availabilityFilter}
				onAvailabilityChange={setAvailabilityFilter}
				experience={experienceFilter}
				onExperienceChange={setExperienceFilter}
				role={roleFilter}
				onRoleChange={setRoleFilter}
				allRoleTypes={allRoleTypes}
				location={selectedLocation}
				onLocationChange={handleLocationChange}
				allLocations={allLocations}
				search={searchQuery}
				onSearchChange={setSearchQuery}
				allTags={allTags}
				selectedTags={selectedTags}
				onToggleTag={toggleTag}
				onClearTags={() => setSelectedTags([])}
				tagsExpanded={tagsExpanded}
				onTagsExpandedChange={setTagsExpanded}
				resultCount={sortedCandidates.length}
			/>

			{displayedCandidates.length === 0 ? (
				<p className="py-8 text-center text-muted">
					No candidates found matching your criteria.
				</p>
			) : (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(min(360px,100%),1fr))] gap-4">
					{displayedCandidates.map((candidate) => (
						<CandidateCard
							key={candidate.id}
							candidate={candidate}
							isHot={isHotCandidate(candidate)}
							isTop={hasTopTag(candidate)}
							isTopStyle={showTopCardStyle(candidate)}
							onExpand={() => openCandidate(candidate)}
						/>
					))}
				</div>
			)}

			{expandedCandidate && (
				<ExpandedCandidateView
					candidate={expandedCandidate}
					isHot={isHotCandidate(expandedCandidate)}
					isTop={hasTopTag(expandedCandidate)}
					isTopStyle={showTopCardStyle(expandedCandidate)}
					onClose={closeCandidate}
					onCVClick={() => trackCandidateCVClick(getCandidateEventProps(expandedCandidate))}
					onSocialClick={(platform, url) => trackCandidateSocialClick({
						...getCandidateEventProps(expandedCandidate),
						platform,
						url,
					})}
					onContactClick={(contactType) => trackCandidateContactClick({
						...getCandidateEventProps(expandedCandidate),
						contact_type: contactType,
					})}
				/>
			)}

			{/* Infinite scroll sentinel */}
			{hasMore && (
				<div ref={loadMoreRef} className="flex justify-center py-8">
					<div className="flex items-center gap-2 text-muted">
						<SpinnerIcon />
						<span className="text-sm">Loading more candidates...</span>
					</div>
				</div>
			)}
		</div>
	);
}
