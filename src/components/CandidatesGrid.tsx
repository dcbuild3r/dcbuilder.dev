"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
	Candidate,
	AvailabilityStatus,
	ExperienceLevel,
	JobTag,
	tagLabels,
	availabilityLabels,
	experienceLabels,
	DCBUILDER_TELEGRAM,
} from "@/data/candidates";

interface CandidatesGridProps {
	candidates: Candidate[];
}

export function CandidatesGrid({ candidates }: CandidatesGridProps) {
	const [availabilityFilter, setAvailabilityFilter] = useState<
		"all" | AvailabilityStatus
	>("all");
	const [experienceFilter, setExperienceFilter] = useState<
		"all" | ExperienceLevel
	>("all");
	const [selectedTags, setSelectedTags] = useState<JobTag[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [shuffleKey, setShuffleKey] = useState(0);
	const [showAll, setShowAll] = useState(false);

	// Trigger shuffle only on client after hydration
	useEffect(() => {
		setShuffleKey(Math.random());
	}, []);

	// Get all unique tags from candidates
	const allTags = useMemo(() => {
		const tags = new Set<JobTag>();
		candidates.forEach((c) => c.skills?.forEach((tag) => tags.add(tag)));
		return Array.from(tags).sort();
	}, [candidates]);

	const toggleTag = (tag: JobTag) => {
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
	}, [candidates, availabilityFilter, experienceFilter, searchQuery, selectedTags]);

	// Sort: hot first, then featured (randomized), then by tier, then remaining
	const sortedCandidates = useMemo(() => {
		const hot = filteredCandidates.filter((c) => c.hot);
		const featured = filteredCandidates.filter((c) => c.featured && !c.hot);
		const nonFeatured = filteredCandidates.filter((c) => !c.featured && !c.hot);

		// Only shuffle after hydration (when shuffleKey > 0)
		if (shuffleKey > 0) {
			// Shuffle hot candidates
			for (let i = hot.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[hot[i], hot[j]] = [hot[j], hot[i]];
			}
			// Shuffle featured candidates
			for (let i = featured.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[featured[i], featured[j]] = [featured[j], featured[i]];
			}
		}

		// Group non-featured by tier
		const tierGroups: Record<number, Candidate[]> = {};
		nonFeatured.forEach((candidate) => {
			const tier = candidate.tier;
			if (!tierGroups[tier]) tierGroups[tier] = [];
			tierGroups[tier].push(candidate);
		});

		// Shuffle each tier group (only after hydration)
		if (shuffleKey > 0) {
			Object.values(tierGroups).forEach((group) => {
				for (let i = group.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[group[i], group[j]] = [group[j], group[i]];
				}
			});
		}

		// Combine tiers in order
		const sortedNonFeatured = Object.keys(tierGroups)
			.map(Number)
			.sort((a, b) => a - b)
			.flatMap((tier) => tierGroups[tier]);

		return [...hot, ...featured, ...sortedNonFeatured];
	}, [filteredCandidates, shuffleKey]);

	// Limit display unless showAll is true
	const displayedCandidates = showAll
		? sortedCandidates
		: sortedCandidates.slice(0, 12);
	const hasMore = sortedCandidates.length > 12 && !showAll;

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="flex flex-wrap items-center gap-4">
				{/* Availability Filter */}
				<div className="flex items-center gap-2">
					<label
						htmlFor="availability-filter"
						className="text-sm text-neutral-600 dark:text-neutral-400"
					>
						Status:
					</label>
					<select
						id="availability-filter"
						value={availabilityFilter}
						onChange={(e) =>
							setAvailabilityFilter(
								e.target.value as "all" | AvailabilityStatus
							)
						}
						className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
					>
						<option value="all">All</option>
						<option value="looking">Actively Looking</option>
						<option value="open">Open to Opportunities</option>
						<option value="not-looking">Not Currently Looking</option>
					</select>
				</div>

				{/* Experience Filter */}
				<div className="flex items-center gap-2">
					<label
						htmlFor="experience-filter"
						className="text-sm text-neutral-600 dark:text-neutral-400"
					>
						Experience:
					</label>
					<select
						id="experience-filter"
						value={experienceFilter}
						onChange={(e) =>
							setExperienceFilter(e.target.value as "all" | ExperienceLevel)
						}
						className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
					>
						<option value="all">All Experience</option>
						{(
							Object.entries(experienceLabels) as [ExperienceLevel, string][]
						).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</div>

				{/* Search */}
				<div className="flex-1 min-w-[200px]">
					<input
						type="text"
						placeholder="Search candidates..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
					/>
				</div>

				{/* Results count */}
				<span className="text-sm text-neutral-500">
					{sortedCandidates.length}{" "}
					{sortedCandidates.length === 1 ? "candidate" : "candidates"}
				</span>
			</div>

			{/* Tag Filters */}
			{allTags.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{allTags.map((tag) => (
						<button
							key={tag}
							onClick={() => toggleTag(tag)}
							className={`px-3 py-1 text-sm rounded-full transition-all ${
								tag === "hot"
									? selectedTags.includes(tag)
										? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-[0_0_15px_rgba(251,146,60,0.6)]"
										: "bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold shadow-[0_0_10px_rgba(251,146,60,0.4)] hover:shadow-[0_0_15px_rgba(251,146,60,0.6)]"
									: selectedTags.includes(tag)
										? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
										: "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
							}`}
						>
							{tagLabels[tag]}
						</button>
					))}
					{selectedTags.length > 0 && (
						<button
							onClick={() => setSelectedTags([])}
							className="px-3 py-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
						>
							Clear
						</button>
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
						<CandidateCard key={candidate.id} candidate={candidate} />
					))
				)}
			</div>

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

function CandidateCard({ candidate }: { candidate: Candidate }) {
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
				<div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
					<Image
						src={profileImage}
						alt={displayName}
						width={48}
						height={48}
						className="object-cover w-full h-full"
					/>
				</div>

				<div className="flex-1 min-w-0">
					<h3 className="font-semibold truncate">
						{displayName}
						{candidate.featured && (
							<span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
								★
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
									: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
							}`}
						>
							{tagLabels[tag]}
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
					<a
						href={DCBUILDER_TELEGRAM}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
					>
						<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
							<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
						</svg>
						Request Introduction
					</a>
				) : (
					<div className="flex items-center justify-center gap-3">
						{candidate.socials?.twitter && (
							<a
								href={candidate.socials.twitter}
								target="_blank"
								rel="noopener noreferrer"
								className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="X (Twitter)"
							>
								<svg
									className="w-4 h-4"
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
								className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="GitHub"
							>
								<svg
									className="w-4 h-4"
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
								className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="LinkedIn"
							>
								<svg
									className="w-4 h-4"
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
								className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="Email"
							>
								<svg
									className="w-4 h-4"
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
								className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="Website"
							>
								<svg
									className="w-4 h-4"
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
								className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="Telegram"
							>
								<svg
									className="w-4 h-4"
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
								className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
								title="CV / Resume"
							>
								<svg
									className="w-4 h-4"
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
				)}
			</div>
		</div>
	);
}
