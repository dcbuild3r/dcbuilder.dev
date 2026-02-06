"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, useRef, useCallback, memo, useDeferredValue } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { hashString, seededRandom, shuffleArray, isNew } from "@/lib/shuffle";
import { cn } from "@/lib/utils";
import { useHotCandidates } from "@/hooks/useHotCandidates";
import { HotBadge, TopBadge, NewBadge, Badge } from "./ui/badge";
import { SocialLinks } from "./ui/social-links";
import {
	CloseIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	SpinnerIcon,
	TelegramIcon,
} from "./ui/icons";

const ExpandedCandidateView = dynamic(
	() => import("./ExpandedCandidateView").then((mod) => mod.ExpandedCandidateView),
	{ ssr: false }
);

interface CandidatesGridProps {
	candidates: Candidate[];
}

export function CandidatesGrid({ candidates }: CandidatesGridProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
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
	const deferredSearchQuery = useDeferredValue(searchQuery);
	const [displayCount, setDisplayCount] = useState(12);
	const [expandedCandidate, setExpandedCandidate] = useState<Candidate | null>(() => {
		const candidateId = searchParams.get("candidate");
		if (!candidateId) return null;
		return candidates.find((c) => c.id === candidateId) ?? null;
	});
	const lastActiveRef = useRef<HTMLElement | null>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);

	// Use custom hook for hot candidates logic (better separation of concerns)
	const { isHotCandidate, hasTopTag, showTopCardStyle } = useHotCandidates();

	const replaceSearchParams = useCallback((nextParams: URLSearchParams) => {
		const queryString = nextParams.toString();
		if (queryString === searchParams.toString()) return;
		router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
	}, [pathname, router, searchParams]);

	const updateUrlParams = useCallback((updates: Record<string, string | null>) => {
		const nextParams = new URLSearchParams(searchParams.toString());
		Object.entries(updates).forEach(([key, value]) => {
			if (value === null || value === "") {
				nextParams.delete(key);
			} else {
				nextParams.set(key, value);
			}
		});
		replaceSearchParams(nextParams);
	}, [replaceSearchParams, searchParams]);

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
	}, [availabilityFilter, experienceFilter, roleFilter, searchQuery, selectedTags]);

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

	const candidateSearchIndex = useMemo(() => {
		const index = new Map<string, string>();
		candidates.forEach((candidate) => {
			const displayName =
				candidate.visibility === "anonymous"
					? candidate.anonymousAlias || "Anonymous"
					: candidate.name;
			const tagText = candidate.skills?.map((t) => tagLabels[t]).join(" ") || "";
			index.set(
				candidate.id,
				[displayName, candidate.title, candidate.bio, candidate.location, tagText]
					.filter(Boolean)
					.join(" ")
					.toLowerCase(),
			);
		});
		return index;
	}, [candidates]);

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
			if (deferredSearchQuery) {
				const query = deferredSearchQuery.toLowerCase();
				const searchableText = candidateSearchIndex.get(candidate.id) || "";
				if (!searchableText.includes(query)) {
					return false;
				}
			}

			return true;
		});
	}, [candidates, availabilityFilter, experienceFilter, roleFilter, deferredSearchQuery, selectedTags, candidateSearchIndex]);

	// Include today's date so shuffle changes daily (stable after hydration)
	const [shuffleSeed] = useState(() => new Date().toISOString().split("T")[0]);

	const filterKey = useMemo(
		() =>
			[
					availabilityFilter,
					experienceFilter,
					roleFilter,
					deferredSearchQuery,
					selectedTags.join(","),
					shuffleSeed,
				].join("|"),
		[availabilityFilter, experienceFilter, roleFilter, deferredSearchQuery, selectedTags, shuffleSeed]
	);

	// Helper to check skill tags
	const hasSkillTag = useCallback((candidate: Candidate, tag: string) => {
		return candidate.skills?.includes(tag as SkillTag) ?? false;
	}, []);

	// Deterministic shuffle: hot+top, hot, top, featured, verified, then unverified
	const sortedCandidates = useMemo(() => {
		// Priority groups
		const hotAndTop = filteredCandidates.filter(
			(c) => hasSkillTag(c, "hot") && hasSkillTag(c, "top")
		);
		const hotOnly = filteredCandidates.filter(
			(c) => hasSkillTag(c, "hot") && !hasSkillTag(c, "top")
		);
		const topOnly = filteredCandidates.filter(
			(c) => hasSkillTag(c, "top") && !hasSkillTag(c, "hot")
		);

		// Remaining candidates (no hot/top tags)
		const remaining = filteredCandidates.filter(
			(c) => !hasSkillTag(c, "hot") && !hasSkillTag(c, "top")
		);

		// Split remaining by featured, verified, and unverified
		const featured = remaining.filter((c) => c.featured);
		const verified = remaining.filter((c) => !c.featured && c.vouched === true);
		const unverified = remaining.filter((c) => !c.featured && c.vouched !== true);

		// Shuffle and sort each group by tier (deterministic)
		const shuffleAndSortByTier = (candidates: Candidate[], seedPrefix: string) => {
			const tierGroups: Record<number, Candidate[]> = {};
			candidates.forEach((candidate) => {
				const tier = candidate.tier;
				if (!tierGroups[tier]) tierGroups[tier] = [];
				tierGroups[tier].push(candidate);
			});
			return Object.keys(tierGroups)
				.map(Number)
				.sort((a, b) => a - b)
				.flatMap((tier) =>
					shuffleArray(
						tierGroups[tier],
						seededRandom(hashString(`${filterKey}|${seedPrefix}|tier-${tier}`))
					)
				);
		};

		return [
			...shuffleAndSortByTier(hotAndTop, "hot-top"),
			...shuffleAndSortByTier(hotOnly, "hot-only"),
			...shuffleAndSortByTier(topOnly, "top-only"),
			...shuffleAndSortByTier(featured, "featured"),
			...shuffleAndSortByTier(verified, "verified"),
			...shuffleAndSortByTier(unverified, "unverified"),
		];
	}, [filteredCandidates, hasSkillTag, filterKey]);

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
				</div>

				{/* Row 2: Search */}
				<div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
						<div className="flex-1 relative">
							<input
								type="text"
								aria-label="Search candidates"
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
								<CloseIcon className="size-4" />
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
							<ChevronDownIcon
								className={cn("transition-transform", tagsExpanded && "rotate-180")}
							/>
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
									<CloseIcon className="size-3.5" />
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
									className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
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
								<CloseIcon className="size-4" />
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
							isHot={isHotCandidate(candidate)}
							isTop={hasTopTag(candidate)}
							isTopStyle={showTopCardStyle(candidate)}
							onExpand={() => openCandidate(candidate)}
						/>
					))
				)}
			</div>

			{/* Expanded Profile View */}
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
				<div
					ref={loadMoreRef}
					className="flex justify-center py-8"
				>
					<div className="flex items-center gap-2 text-neutral-500">
						<SpinnerIcon />
						<span className="text-sm">Loading more candidates...</span>
					</div>
				</div>
			)}
		</div>
	);
}

// Constants for image URLs (hoisted to avoid recreating on each render)
const ANONYMOUS_PLACEHOLDER =
	"https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/anonymous-placeholder.svg";

// Card style variants (hoisted for performance)
const CARD_STYLES = {
	hot: "border-orange-500 dark:border-orange-400 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 shadow-[0_0_8px_rgba(251,146,60,0.5)] dark:shadow-[0_0_10px_rgba(251,146,60,0.4)]",
	top: "border-violet-500 dark:border-violet-400 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 shadow-[0_0_8px_rgba(139,92,246,0.5)] dark:shadow-[0_0_10px_rgba(139,92,246,0.4)]",
	default: "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600",
} as const;

interface CandidateCardProps {
	candidate: Candidate;
	isHot: boolean;
	isTop: boolean;
	isTopStyle: boolean;
	onExpand: () => void;
}

/**
 * Memoized candidate card component to prevent unnecessary re-renders.
 * Uses React.memo for performance optimization in large lists.
 */
const CandidateCard = memo(function CandidateCard({
	candidate,
	isHot,
	isTop,
	isTopStyle,
	onExpand,
}: CandidateCardProps) {
	const isAnonymous = candidate.visibility === "anonymous";
	const displayName = isAnonymous
		? candidate.anonymousAlias || "Anonymous"
		: candidate.name;
	const profileImage = isAnonymous
		? ANONYMOUS_PLACEHOLDER
		: candidate.profileImage || ANONYMOUS_PLACEHOLDER;

	// Determine card styling based on status (uses isTopStyle to prevent flicker)
	const cardStyle = isHot
		? CARD_STYLES.hot
		: isTopStyle
			? CARD_STYLES.top
			: CARD_STYLES.default;

	return (
		<div
			className={cn("p-4 rounded-xl border transition-[border-color,box-shadow,background-color] overflow-hidden", cardStyle)}
		>
			{/* Header */}
			<div className="flex flex-col items-center gap-3 text-center">
				{/* Profile Image */}
				<div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 hover:scale-[1.08] transition-transform duration-150">
					<Image
						src={profileImage}
						alt={displayName}
						width={56}
						height={56}
						className="object-cover w-full h-full"
						onError={(e) => {
							e.currentTarget.onerror = null;
							e.currentTarget.src = "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/anonymous-placeholder.svg";
						}}
					/>
				</div>

				<div className="w-full min-w-0">
					<h3 className="font-semibold flex items-center justify-center gap-1">
						<span className="truncate">{displayName}</span>
						<span className="flex-shrink-0 flex items-center gap-0.5">
							{candidate.featured && (
								<span className="text-xs text-amber-600 dark:text-amber-400">
									★
								</span>
							)}
							{candidate.vouched !== false ? (
								<span
									className="text-xs text-green-600 dark:text-green-400"
									title="Personally vouched"
								>
									✓
								</span>
							) : (
								<span
									className="text-xs text-amber-600 dark:text-amber-400"
									title="Referred (not personally known)"
								>
									◇
								</span>
							)}
						</span>
					</h3>
					<p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
						{candidate.title}
					</p>
					<div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
						<Badge
							variant={candidate.availability === "looking" ? "success" : candidate.availability === "open" ? "info" : "muted"}
							size="sm"
						>
							{availabilityLabels[candidate.availability]}
						</Badge>
						{isHot && <HotBadge size="sm" />}
						{isTop && <TopBadge size="sm" />}
						{isNew(candidate.createdAt) && <NewBadge size="sm" />}
					</div>
				</div>
			</div>

			{/* Bio */}
			<p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 text-center">
				{candidate.bio}
			</p>

			{/* Meta info */}
			<div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-neutral-500">
				{candidate.location && <span>{candidate.location}</span>}
				{candidate.remote && (
					<span className="text-green-600 dark:text-green-400">Remote OK</span>
				)}
				{candidate.experience && <span>{experienceLabels[candidate.experience]}</span>}
			</div>

			{/* Skills - min-height for consistent card sizing, allows expansion if needed */}
			<div className="mt-3 min-h-[52px] flex flex-wrap items-start justify-center gap-1.5 overflow-hidden">
				{(() => {
					const displaySkills = (candidate.skills || []).filter((tag) => tag !== "hot" && tag !== "top");
					const maxTags = 4;
					if (displaySkills.length === 0) return null;
					return (
						<>
							{displaySkills.slice(0, maxTags).map((tag) => (
								<span
									key={tag}
									className="px-2 py-1 text-xs leading-none rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
								>
									{tagLabels[tag] ?? tag}
								</span>
							))}
							{displaySkills.length > maxTags && (
								<span className="px-2 py-1 text-xs leading-none text-neutral-500">
									+{displaySkills.length - maxTags} more
								</span>
							)}
						</>
					);
				})()}
			</div>

			{/* View Details Button - above separator */}
			<div className="mt-4">
				<button
					onClick={(event) => {
						event.stopPropagation();
						onExpand();
					}}
					className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
				>
					<span>View Details</span>
					<ChevronRightIcon />
				</button>
			</div>

			{/* Contact Section */}
			<div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
				{isAnonymous ? (
					<a
						href={DCBUILDER_TELEGRAM}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
					>
						<TelegramIcon className="size-4" />
						Request Introduction
					</a>
				) : (
					candidate.socials && (
						<SocialLinks
							socials={candidate.socials}
							displayName={displayName}
							variant="compact"
							className="justify-center"
						/>
					)
				)}
			</div>
		</div>
	);
});
