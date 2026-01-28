"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
	Candidate,
	AvailabilityStatus,
	ExperienceLevel,
	SkillTag,
	RoleType,
	tagLabels,
	availabilityLabels,
	experienceLabels,
	roleTypeLabels,
	DCBUILDER_TELEGRAM,
} from "@/data/candidates";
import { CustomSelect } from "./CustomSelect";
import {
	trackCandidateView,
	trackCandidateCVClick,
	trackCandidateSocialClick,
	trackCandidateContactClick,
} from "@/lib/posthog";

interface CandidatesGridProps {
	candidates: Candidate[];
}

// Fisher-Yates shuffle (pure function)
function shuffleArray<T>(array: T[]): T[] {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

export function CandidatesGrid({ candidates }: CandidatesGridProps) {
	const [availabilityFilter, setAvailabilityFilter] = useState<
		"all" | AvailabilityStatus
	>("all");
	const [experienceFilter, setExperienceFilter] = useState<
		"all" | ExperienceLevel
	>("all");
	const [roleFilter, setRoleFilter] = useState<"all" | RoleType>("all");
	const [selectedTags, setSelectedTags] = useState<SkillTag[]>([]);
	const [tagsExpanded, setTagsExpanded] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [shuffledCandidates, setShuffledCandidates] = useState<Candidate[]>([]);
	const [shuffledCandidatesKey, setShuffledCandidatesKey] = useState("");
	const [isHydrated, setIsHydrated] = useState(false);
	const [showAll, setShowAll] = useState(false);
	const [expandedCandidate, setExpandedCandidate] = useState<Candidate | null>(
		null
	);
	const lastActiveRef = useRef<HTMLElement | null>(null);

	// Helper to update URL params without React re-render
	const updateUrlParams = useCallback((updates: Record<string, string | null>) => {
		const url = new URL(window.location.href);
		Object.entries(updates).forEach(([key, value]) => {
			if (value === null || value === "") {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(key, value);
			}
		});
		window.history.replaceState(null, "", url.pathname + url.search);
	}, []);

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
		lastActiveRef.current = document.activeElement as HTMLElement | null;
		setExpandedCandidate(candidate);
		updateUrlParams({ candidate: candidate.id });
		trackCandidateView(getCandidateEventProps(candidate));
	}, [updateUrlParams, getCandidateEventProps]);

	const closeCandidate = useCallback(() => {
		setExpandedCandidate(null);
		updateUrlParams({ candidate: null });
	}, [updateUrlParams]);

	// Mark as hydrated after mount and check for candidate URL param
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration flag set post-mount.
		setIsHydrated(true);

		// Check if there's a candidate param in URL
		const urlParams = new URLSearchParams(window.location.search);
		const candidateId = urlParams.get("candidate");
		if (candidateId) {
			const candidate = candidates.find((c) => c.id === candidateId);
			if (candidate) {
				setExpandedCandidate(candidate);
			}
		}
	}, [candidates]);

	// Close expanded view on escape key
	useEffect(() => {
		if (!expandedCandidate) return;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeCandidate();
		};
		const previousOverflow = document.body.style.overflow;
		document.addEventListener("keydown", handleEscape);
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = previousOverflow;
		};
	}, [expandedCandidate, closeCandidate]);

	useEffect(() => {
		if (!expandedCandidate && lastActiveRef.current) {
			lastActiveRef.current.focus();
		}
	}, [expandedCandidate]);

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

	const toggleTag = (tag: SkillTag) => {
		setSelectedTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
		);
	};

	const filteredCandidates = useMemo(() => {
		return candidates.filter((candidate) => {
			// Availability filter
			if (
				availabilityFilter !== "all" &&
				candidate.availability !== availabilityFilter
			) {
				return false;
			}

			// Experience filter
			if (
				experienceFilter !== "all" &&
				candidate.experience !== experienceFilter
			) {
				return false;
			}

			// Role type filter
			if (roleFilter !== "all") {
				if (!candidate.lookingFor?.includes(roleFilter)) {
					return false;
				}
			}

			// Tag filter (candidate must have ALL selected tags)
			if (selectedTags.length > 0) {
				if (
					!candidate.skills ||
					!selectedTags.every((tag) => candidate.skills?.includes(tag))
				) {
					return false;
				}
			}

			// Search filter (name, alias, title, bio, skills)
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const displayName =
					candidate.visibility === "anonymous"
						? candidate.anonymousAlias || "Anonymous"
						: candidate.name;
				const tagText =
					candidate.skills?.map((t) => tagLabels[t]).join(" ") || "";
				const searchableText = [
					displayName,
					candidate.title,
					candidate.bio,
					candidate.location,
					tagText,
				]
					.filter(Boolean)
					.join(" ")
					.toLowerCase();
				if (!searchableText.includes(query)) {
					return false;
				}
			}

			return true;
		});
	}, [candidates, availabilityFilter, experienceFilter, roleFilter, searchQuery, selectedTags]);

	const filterKey = useMemo(
		() =>
			[
				availabilityFilter,
				experienceFilter,
				roleFilter,
				searchQuery,
				selectedTags.join(","),
			].join("|"),
		[availabilityFilter, experienceFilter, roleFilter, searchQuery, selectedTags]
	);

	// Sort: hot first, then featured, then by tier (deterministic - no shuffle)
	const sortedCandidates = useMemo(() => {
		const hot = filteredCandidates.filter((c) => c.hot);
		const featured = filteredCandidates.filter((c) => c.featured && !c.hot);
		const nonFeatured = filteredCandidates.filter((c) => !c.featured && !c.hot);

		// Group non-featured by tier
		const tierGroups: Record<number, Candidate[]> = {};
		nonFeatured.forEach((candidate) => {
			const tier = candidate.tier;
			if (!tierGroups[tier]) tierGroups[tier] = [];
			tierGroups[tier].push(candidate);
		});

		// Combine tiers in order (deterministic)
		const sortedNonFeatured = Object.keys(tierGroups)
			.map(Number)
			.sort((a, b) => a - b)
			.flatMap((tier) => tierGroups[tier]);

		return [...hot, ...featured, ...sortedNonFeatured];
	}, [filteredCandidates]);

	// Shuffle in useEffect after hydration (React-safe)
	useEffect(() => {
		if (!isHydrated) return;

		const hot = filteredCandidates.filter((c) => c.hot);
		const featured = filteredCandidates.filter((c) => c.featured && !c.hot);
		const nonFeatured = filteredCandidates.filter((c) => !c.featured && !c.hot);

		// Shuffle each group
		const shuffledHot = shuffleArray(hot);
		const shuffledFeatured = shuffleArray(featured);

		// Group and shuffle non-featured by tier
		const tierGroups: Record<number, Candidate[]> = {};
		nonFeatured.forEach((candidate) => {
			const tier = candidate.tier;
			if (!tierGroups[tier]) tierGroups[tier] = [];
			tierGroups[tier].push(candidate);
		});

		const sortedNonFeatured = Object.keys(tierGroups)
			.map(Number)
			.sort((a, b) => a - b)
			.flatMap((tier) => shuffleArray(tierGroups[tier]));

		// eslint-disable-next-line react-hooks/set-state-in-effect -- Shuffle is derived after hydration.
		setShuffledCandidates([
			...shuffledHot,
			...shuffledFeatured,
			...sortedNonFeatured,
		]);
		setShuffledCandidatesKey(filterKey);
	}, [filteredCandidates, isHydrated, filterKey]);

	// Use shuffled after hydration, otherwise use deterministic sort
	const candidatesToDisplay =
		isHydrated &&
		shuffledCandidates.length > 0 &&
		shuffledCandidatesKey === filterKey
			? shuffledCandidates
			: sortedCandidates;

	// Limit display unless showAll is true
	const displayedCandidates = showAll
		? candidatesToDisplay
		: candidatesToDisplay.slice(0, 12);
	const hasMore = candidatesToDisplay.length > 12 && !showAll;

	return (
		<div
			className="space-y-6"
			data-testid="candidates-grid"
			data-hydrated={isHydrated ? "true" : "false"}
		>
			{/* Filters */}
			<div className="space-y-4">
				{/* Row 1: Status and Experience filters */}
				<div className="flex flex-col sm:flex-row gap-3">
					{/* Availability Filter */}
					<div className="flex items-center gap-2">
						<label
							htmlFor="availability-filter"
							className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
						>
							Status:
						</label>
						<CustomSelect
							id="availability-filter"
							value={availabilityFilter}
							onChange={(value) => setAvailabilityFilter(value as "all" | AvailabilityStatus)}
							options={[
								{ value: "all", label: "All" },
								{ value: "looking", label: "Actively Looking" },
								{ value: "open", label: "Open to Opportunities" },
								{ value: "not-looking", label: "Not Currently Looking" },
							]}
							className="flex-1 sm:flex-none sm:min-w-[180px]"
						/>
					</div>

					{/* Experience Filter */}
					<div className="flex items-center gap-2">
						<label
							htmlFor="experience-filter"
							className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
						>
							Experience:
						</label>
						<CustomSelect
							id="experience-filter"
							value={experienceFilter}
							onChange={(value) => setExperienceFilter(value as "all" | ExperienceLevel)}
							options={[
								{ value: "all", label: "All Experience" },
								...(Object.entries(experienceLabels) as [ExperienceLevel, string][]).map(
									([value, label]) => ({ value, label })
								),
							]}
							className="flex-1 sm:flex-none sm:min-w-[160px]"
						/>
					</div>

					{/* Role Type Filter */}
					{allRoleTypes.length > 0 && (
						<div className="flex items-center gap-2">
							<label
								htmlFor="role-filter"
								className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap"
							>
								Looking For:
							</label>
							<CustomSelect
								id="role-filter"
								value={roleFilter}
								onChange={(value) => setRoleFilter(value as "all" | RoleType)}
								options={[
									{ value: "all", label: "All Roles" },
									...allRoleTypes.map((role) => ({
										value: role,
										label: roleTypeLabels[role],
									})),
								]}
								className="flex-1 sm:flex-none sm:min-w-[160px]"
							/>
						</div>
					)}
				</div>

				{/* Row 2: Search */}
				<div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
					<div className="flex-1 relative">
						<input
							type="text"
							placeholder="Search candidates..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={() => setSearchQuery("")}
								className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
								aria-label="Clear search"
							>
								<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
						)}
					</div>
					{/* Results count */}
					<span className="text-sm text-neutral-500 text-center sm:text-left">
						{sortedCandidates.length}{" "}
						{sortedCandidates.length === 1 ? "candidate" : "candidates"}
					</span>
				</div>
			</div>

			{/* Tag Filters - Collapsible on mobile */}
			{allTags.length > 0 && (
				<div className="space-y-3">
					{/* Toggle button and selected tags */}
					<div className="flex flex-wrap items-center gap-2">
						<button
							onClick={() => setTagsExpanded(!tagsExpanded)}
							className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
						>
							<span>Filter by skills</span>
							<svg
								className={`w-4 h-4 transition-transform ${tagsExpanded ? 'rotate-180' : ''}`}
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
							</svg>
						</button>
						{/* Selected tags as pills */}
						{selectedTags.map((tag) => (
							<span
								key={tag}
								className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full ${
									tag === "hot"
										? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold"
										: tag === "top"
											? "bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold"
											: "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
								}`}
							>
								{tagLabels[tag] ?? tag}
								<button
									onClick={() => toggleTag(tag)}
									className="ml-1 hover:opacity-70"
									aria-label={`Remove ${tagLabels[tag] ?? tag} filter`}
								>
									<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</span>
						))}
						{selectedTags.length > 0 && (
							<button
								onClick={() => setSelectedTags([])}
								className="px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
							>
								Clear all
							</button>
						)}
					</div>

					{/* Expanded tag list */}
					{tagsExpanded && (
						<div className="flex flex-wrap gap-2 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
							{allTags.map((tag) => (
								<button
									key={tag}
									onClick={() => toggleTag(tag)}
									className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all ${
										tag === "hot"
											? selectedTags.includes(tag)
												? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-[0_0_15px_rgba(251,146,60,0.6)]"
												: "bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold shadow-[0_0_10px_rgba(251,146,60,0.4)] hover:shadow-[0_0_15px_rgba(251,146,60,0.6)]"
											: tag === "top"
												? selectedTags.includes(tag)
													? "bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-[0_0_15px_rgba(139,92,246,0.6)]"
													: "bg-gradient-to-r from-violet-400 to-purple-400 text-white font-semibold shadow-[0_0_10px_rgba(139,92,246,0.4)] hover:shadow-[0_0_15px_rgba(139,92,246,0.6)]"
												: selectedTags.includes(tag)
													? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
													: "bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-600"
									}`}
								>
									{tagLabels[tag] ?? tag}
								</button>
							))}
							<button
								onClick={() => setTagsExpanded(false)}
								className="ml-auto px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1"
							>
								<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
								Close
							</button>
						</div>
					)}
				</div>
			)}

			{/* Candidates Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{displayedCandidates.length === 0 ? (
					<p className="col-span-full text-center py-8 text-neutral-500">
						No candidates found matching your criteria.
					</p>
				) : (
					displayedCandidates.map((candidate) => (
						<CandidateCard
							key={candidate.id}
							candidate={candidate}
							onExpand={() => openCandidate(candidate)}
						/>
					))
				)}
			</div>

			{/* Expanded Profile View */}
			{expandedCandidate && (
				<ExpandedCandidateView
					candidate={expandedCandidate}
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

			{/* Show More Button */}
			{hasMore && (
				<div className="text-center">
					<button
						onClick={() => setShowAll(true)}
						className="px-6 py-2 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
					>
						Show all {sortedCandidates.length} candidates
					</button>
				</div>
			)}
		</div>
	);
}

function CandidateCard({
	candidate,
	onExpand,
}: {
	candidate: Candidate;
	onExpand: () => void;
}) {
	const isAnonymous = candidate.visibility === "anonymous";
	const displayName = isAnonymous
		? candidate.anonymousAlias || "Anonymous"
		: candidate.name;
	const profileImage = isAnonymous
		? "/images/candidates/anonymous-placeholder.svg"
		: candidate.profileImage || "/images/candidates/anonymous-placeholder.svg";
	const availabilityColor = {
		looking:
			"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
		open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
		"not-looking":
			"bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
	};

	return (
		<div
			className={`p-4 rounded-xl border transition-all overflow-hidden ${
				candidate.hot
					? "border-orange-400 dark:border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 shadow-[0_0_15px_rgba(251,146,60,0.3)] dark:shadow-[0_0_20px_rgba(251,146,60,0.2)]"
					: "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
			}`}
		>
			{/* Header */}
			<div className="flex items-start gap-3">
				{/* Profile Image */}
				<div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 hover:scale-[1.08] transition-transform duration-150">
					<Image
						src={profileImage}
						alt={displayName}
						width={48}
						height={48}
						className="object-cover w-full h-full"
						onError={(e) => {
							e.currentTarget.onerror = null; // Prevent infinite loop
							console.warn(`[CandidatesGrid] Failed to load image for ${displayName}`);
							e.currentTarget.src = "/images/candidates/anonymous-placeholder.svg";
						}}
					/>
				</div>

				<div className="flex-1 min-w-0">
					<h3 className="font-semibold truncate">
						{displayName}
						{candidate.featured && (
							<span className="ml-1 text-xs text-amber-600 dark:text-amber-400">
								★
							</span>
						)}
						{candidate.vouched !== false ? (
							<span
								className="ml-1 text-xs text-green-600 dark:text-green-400"
								title="Personally vouched"
							>
								✓
							</span>
						) : (
							<span
								className="ml-1 text-xs text-amber-600 dark:text-amber-400"
								title="Referred (not personally known)"
							>
								◇
							</span>
						)}
					</h3>
					<p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
						{candidate.title}
					</p>
					<span
						className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${availabilityColor[candidate.availability]}`}
					>
						{availabilityLabels[candidate.availability]}
					</span>
				</div>
			</div>

			{/* Bio */}
			<p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
				{candidate.bio}
			</p>

			{/* Meta info */}
			<div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
				<span>{candidate.location}</span>
				{candidate.remote && (
					<span className="text-green-600 dark:text-green-400">Remote OK</span>
				)}
				<span>{experienceLabels[candidate.experience]}</span>
			</div>

			{/* Skills */}
			{candidate.skills && candidate.skills.length > 0 && (
				<div className="mt-3 flex flex-wrap gap-1">
					{candidate.skills.slice(0, 4).map((tag) => (
						<span
							key={tag}
							className={`px-2 py-0.5 text-xs rounded-full ${
								tag === "hot"
									? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-[0_0_10px_rgba(251,146,60,0.5)]"
									: tag === "top"
										? "bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-[0_0_10px_rgba(139,92,246,0.5)]"
										: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
							}`}
						>
							{tagLabels[tag] ?? tag}
						</span>
					))}
					{candidate.skills.length > 4 && (
						<span className="px-2 py-0.5 text-xs text-neutral-500">
							+{candidate.skills.length - 4} more
						</span>
					)}
				</div>
			)}

			{/* Contact Section */}
			<div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
				{isAnonymous ? (
					<div className="flex items-center gap-2">
						<a
							href={DCBUILDER_TELEGRAM}
							target="_blank"
							rel="noopener noreferrer"
							className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
						>
							<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
								<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
							</svg>
							Request Introduction
						</a>
						<button
							onClick={(event) => {
								event.stopPropagation();
								onExpand();
							}}
							className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all hover:scale-110"
							title="View full profile"
							aria-label="View full profile"
						>
							<svg
								className="w-5 h-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polyline points="9 18 15 12 9 6" />
							</svg>
						</button>
					</div>
				) : (
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-1">
						{candidate.socials?.x && (
							<a
								href={candidate.socials.x}
								target="_blank"
								rel="noopener noreferrer"
								className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="X"
								aria-label={`X profile for ${displayName}`}
							>
								<svg
									className="w-5 h-5 sm:w-4 sm:h-4"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
								</svg>
							</a>
						)}
						{candidate.socials?.github && (
							<a
								href={candidate.socials.github}
								target="_blank"
								rel="noopener noreferrer"
								className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="GitHub"
								aria-label={`GitHub profile for ${displayName}`}
							>
								<svg
									className="w-5 h-5 sm:w-4 sm:h-4"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
								</svg>
							</a>
						)}
						{candidate.socials?.linkedin && (
							<a
								href={candidate.socials.linkedin}
								target="_blank"
								rel="noopener noreferrer"
								className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="LinkedIn"
								aria-label={`LinkedIn profile for ${displayName}`}
							>
								<svg
									className="w-5 h-5 sm:w-4 sm:h-4"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
								</svg>
							</a>
						)}
						{candidate.socials?.email && (
							<a
								href={`mailto:${candidate.socials.email}`}
								className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="Email"
								aria-label={`Email ${displayName}`}
							>
								<svg
									className="w-5 h-5 sm:w-4 sm:h-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<rect x="2" y="4" width="20" height="16" rx="2" />
									<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
								</svg>
							</a>
						)}
						{candidate.socials?.website && (
							<a
								href={candidate.socials.website}
								target="_blank"
								rel="noopener noreferrer"
								className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="Website"
								aria-label={`Website for ${displayName}`}
							>
								<svg
									className="w-5 h-5 sm:w-4 sm:h-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<circle cx="12" cy="12" r="10" />
									<line x1="2" y1="12" x2="22" y2="12" />
									<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
								</svg>
							</a>
						)}
						{candidate.socials?.telegram && (
							<a
								href={candidate.socials.telegram}
								target="_blank"
								rel="noopener noreferrer"
								className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="Telegram"
								aria-label={`Telegram for ${displayName}`}
							>
								<svg
									className="w-5 h-5 sm:w-4 sm:h-4"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
								</svg>
							</a>
						)}
						{candidate.socials?.cv && (
							<a
								href={candidate.socials.cv}
								target="_blank"
								rel="noopener noreferrer"
								className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="CV / Resume"
								aria-label={`CV or resume for ${displayName}`}
							>
								<svg
									className="w-5 h-5 sm:w-4 sm:h-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
									<polyline points="14 2 14 8 20 8" />
									<line x1="16" y1="13" x2="8" y2="13" />
									<line x1="16" y1="17" x2="8" y2="17" />
									<polyline points="10 9 9 9 8 9" />
								</svg>
							</a>
						)}
						</div>
						<button
							onClick={(event) => {
								event.stopPropagation();
								onExpand();
							}}
							className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all hover:scale-110"
							title="View full profile"
							aria-label="View full profile"
						>
							<svg
								className="w-5 h-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polyline points="9 18 15 12 9 6" />
							</svg>
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

function ExpandedCandidateView({
	candidate,
	onClose,
	onCVClick,
	onSocialClick,
	onContactClick,
}: {
	candidate: Candidate;
	onClose: () => void;
	onCVClick?: () => void;
	onSocialClick?: (platform: string, url: string) => void;
	onContactClick?: (contactType: "email" | "telegram" | "calendly") => void;
}) {
	const isAnonymous = candidate.visibility === "anonymous";
	const displayName = isAnonymous
		? candidate.anonymousAlias || "Anonymous"
		: candidate.name;
	const profileImage = isAnonymous
		? "/images/candidates/anonymous-placeholder.svg"
		: candidate.profileImage || "/images/candidates/anonymous-placeholder.svg";
	const dialogRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const titleId = `candidate-${candidate.id}-title`;
	const descriptionId = `candidate-${candidate.id}-bio`;
	const [copySuccess, setCopySuccess] = useState(false);

	const availabilityColor = {
		looking:
			"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
		open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
		"not-looking":
			"bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
	};

	const handleCopyLink = useCallback(async () => {
		const url = new URL(window.location.href);
		url.searchParams.set("candidate", candidate.id);
		try {
			await navigator.clipboard.writeText(url.toString());
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		} catch (err) {
			console.error("Failed to copy link:", err);
		}
	}, [candidate.id]);

	useEffect(() => {
		closeButtonRef.current?.focus();
	}, []);

	const handleDialogKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key !== "Tab") return;

		const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
			'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
		);
		if (!focusable || focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}, []);

	return (
		<div
			className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				aria-describedby={descriptionId}
				tabIndex={-1}
				onKeyDown={handleDialogKeyDown}
				className={`relative w-full sm:max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl ${
					candidate.hot
						? "ring-2 ring-orange-400 dark:ring-orange-500"
						: "ring-1 ring-neutral-200 dark:ring-neutral-700"
				}`}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Drag handle indicator for mobile */}
				<div className="sm:hidden flex justify-center pt-3">
					<div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
				</div>

				{/* Action buttons - Copy Link and Close */}
				<div className="absolute top-4 right-4 z-10 flex items-center gap-2">
					{/* Copy Link Button */}
					<button
						onClick={handleCopyLink}
						className={`p-3 sm:p-2 rounded-full transition-colors ${
							copySuccess
								? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
								: "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
						}`}
						aria-label={copySuccess ? "Link copied!" : "Copy link to profile"}
						title={copySuccess ? "Link copied!" : "Copy link to profile"}
					>
						{copySuccess ? (
							<svg
								className="w-5 h-5 sm:w-6 sm:h-6"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
						) : (
							<svg
								className="w-5 h-5 sm:w-6 sm:h-6"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
								<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
							</svg>
						)}
					</button>

					{/* Close Button */}
					<button
						ref={closeButtonRef}
						onClick={onClose}
						className="p-3 sm:p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors"
						aria-label="Close profile"
					>
						<svg
							className="w-5 h-5 sm:w-6 sm:h-6"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>

				{/* Header Section */}
				<div
					className={`p-6 sm:p-8 ${
						candidate.hot
							? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
							: "bg-neutral-50 dark:bg-neutral-800/50"
					}`}
				>
					<div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
						{/* Profile Image */}
						<div className="w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 ring-4 ring-white dark:ring-neutral-900 hover:scale-[1.08] transition-transform duration-150">
							<Image
								src={profileImage}
								alt={displayName}
								width={128}
								height={128}
								className="object-cover w-full h-full"
								onError={(e) => {
									console.warn(`[CandidatesGrid] Failed to load image for ${displayName}`);
									e.currentTarget.src = "/images/candidates/anonymous-placeholder.svg";
								}}
							/>
						</div>

						<div className="flex-1">
							<div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
								<h2 id={titleId} className="text-xl sm:text-3xl font-bold">
									{displayName}
								</h2>
								{candidate.featured && (
									<span className="text-lg text-amber-600 dark:text-amber-400">
										★
									</span>
								)}
								{candidate.vouched !== false ? (
									<span
										className="text-lg text-green-600 dark:text-green-400"
										title="Personally vouched"
									>
										✓
									</span>
								) : (
									<span
										className="text-lg text-amber-600 dark:text-amber-400"
										title="Referred (not personally known)"
									>
										◇
									</span>
								)}
								{candidate.hot && (
									<span className="px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_10px_rgba(251,146,60,0.5)]">
										🔥 HOT
									</span>
								)}
							</div>
							<p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 mb-3">
								{candidate.title}
							</p>
							<div className="flex flex-wrap justify-center sm:justify-start gap-2">
								<span
									className={`px-3 py-1 text-sm rounded-full ${availabilityColor[candidate.availability]}`}
								>
									{availabilityLabels[candidate.availability]}
								</span>
								<span className="px-3 py-1 text-sm rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
									{experienceLabels[candidate.experience]}
								</span>
								<span className="px-3 py-1 text-sm rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
									{candidate.location}
								</span>
								{candidate.remote && (
									<span className="px-3 py-1 text-sm rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
										Remote OK
									</span>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Content Section */}
				<div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
					{/* Bio */}
					<div>
						<h3 className="text-lg font-semibold mb-3">About</h3>
						<p
							id={descriptionId}
							className="text-neutral-600 dark:text-neutral-400 leading-relaxed"
						>
							{candidate.bio}
						</p>
					</div>

					{/* Skills */}
					{candidate.skills && candidate.skills.length > 0 && (
						<div>
							<h3 className="text-lg font-semibold mb-3">Skills</h3>
							<div className="flex flex-wrap gap-2">
								{candidate.skills.map((tag) => (
									<span
										key={tag}
										className={`px-3 py-1.5 text-sm rounded-full ${
											tag === "hot"
												? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold"
												: tag === "top"
													? "bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold"
													: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
										}`}
									>
										{tagLabels[tag] ?? tag}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Preferred Roles */}
					{candidate.preferredRoles && candidate.preferredRoles.length > 0 && (
						<div>
							<h3 className="text-lg font-semibold mb-3">Looking For</h3>
							<div className="flex flex-wrap gap-2">
								{candidate.preferredRoles.map((role) => (
									<span
										key={role}
										className="px-3 py-1.5 text-sm rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
									>
										{role}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Previous Companies */}
					{candidate.companies && candidate.companies.length > 0 && (
						<div>
							<h3 className="text-lg font-semibold mb-3">Experience</h3>
							<div className="flex flex-wrap gap-3">
								{candidate.companies.map((company) => (
									<a
										key={company.name}
										href={company.url}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
									>
										{company.logo && (
											<Image
												src={company.logo || "/images/candidates/anonymous-placeholder.svg"}
												alt={company.name}
												width={24}
												height={24}
												className="rounded"
												onError={(e) => {
													e.currentTarget.onerror = null; // Prevent infinite loop
													console.warn(`[CandidatesGrid] Failed to load logo for ${company.name}`);
													e.currentTarget.style.display = "none";
												}}
											/>
										)}
										<span className="font-medium">{company.name}</span>
									</a>
								))}
							</div>
						</div>
					)}

					{/* Achievements */}
					{candidate.achievements && candidate.achievements.length > 0 && (
						<div>
							<h3 className="text-lg font-semibold mb-3">Achievements</h3>
							<ul className="space-y-2">
								{candidate.achievements.map((achievement, i) => (
									<li key={i} className="flex items-start gap-2">
										<span className="text-amber-500">★</span>
										<div>
											{achievement.url ? (
												<a
													href={achievement.url}
													target="_blank"
													rel="noopener noreferrer"
													className="font-medium hover:underline"
												>
													{achievement.title}
												</a>
											) : (
												<span className="font-medium">{achievement.title}</span>
											)}
											{achievement.description && (
												<p className="text-sm text-neutral-500">
													{achievement.description}
												</p>
											)}
										</div>
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Contact Section */}
					<div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
						<h3 className="text-lg font-semibold mb-4">Get in Touch</h3>
						{isAnonymous ? (
							<a
								href={DCBUILDER_TELEGRAM}
								target="_blank"
								rel="noopener noreferrer"
								onClick={() => onContactClick?.("telegram")}
								className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
							>
								<svg
									className="w-5 h-5"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
								</svg>
								Request Introduction via Telegram
							</a>
						) : (
							<div className="flex flex-wrap gap-3">
								{candidate.socials?.x && (
									<a
										href={candidate.socials.x}
										target="_blank"
										rel="noopener noreferrer"
										onClick={() => onSocialClick?.("x", candidate.socials!.x!)}
										className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
										title="X"
									>
										<svg
											className="w-5 h-5"
											viewBox="0 0 24 24"
											fill="currentColor"
										>
											<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
										</svg>
									</a>
								)}
								{candidate.socials?.github && (
									<a
										href={candidate.socials.github}
										target="_blank"
										rel="noopener noreferrer"
										onClick={() => onSocialClick?.("github", candidate.socials!.github!)}
										className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
									>
										<svg
											className="w-5 h-5"
											viewBox="0 0 24 24"
											fill="currentColor"
										>
											<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
										</svg>
										<span>GitHub</span>
									</a>
								)}
								{candidate.socials?.linkedin && (
									<a
										href={candidate.socials.linkedin}
										target="_blank"
										rel="noopener noreferrer"
										onClick={() => onSocialClick?.("linkedin", candidate.socials!.linkedin!)}
										className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
									>
										<svg
											className="w-5 h-5"
											viewBox="0 0 24 24"
											fill="currentColor"
										>
											<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
										</svg>
										<span>LinkedIn</span>
									</a>
								)}
								{candidate.socials?.email && (
									<a
										href={`mailto:${candidate.socials.email}`}
										onClick={() => onContactClick?.("email")}
										className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
									>
										<svg
											className="w-5 h-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<rect x="2" y="4" width="20" height="16" rx="2" />
											<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
										</svg>
										<span>Email</span>
									</a>
								)}
								{candidate.socials?.website && (
									<a
										href={candidate.socials.website}
										target="_blank"
										rel="noopener noreferrer"
										onClick={() => onSocialClick?.("website", candidate.socials!.website!)}
										className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
									>
										<svg
											className="w-5 h-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<circle cx="12" cy="12" r="10" />
											<line x1="2" y1="12" x2="22" y2="12" />
											<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
										</svg>
										<span>Website</span>
									</a>
								)}
								{candidate.socials?.telegram && (
									<a
										href={candidate.socials.telegram}
										target="_blank"
										rel="noopener noreferrer"
										onClick={() => onSocialClick?.("telegram", candidate.socials!.telegram!)}
										className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
									>
										<svg
											className="w-5 h-5"
											viewBox="0 0 24 24"
											fill="currentColor"
										>
											<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
										</svg>
										<span>Telegram</span>
									</a>
								)}
								{candidate.socials?.cv && (
									<a
										href={candidate.socials.cv}
										target="_blank"
										rel="noopener noreferrer"
										onClick={onCVClick}
										className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
									>
										<svg
											className="w-5 h-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
											<polyline points="14 2 14 8 20 8" />
											<line x1="16" y1="13" x2="8" y2="13" />
											<line x1="16" y1="17" x2="8" y2="17" />
											<polyline points="10 9 9 9 8 9" />
										</svg>
										<span>View CV / Resume</span>
									</a>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
