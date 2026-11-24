"use client";

import {
	tagLabels,
	experienceLabels,
	roleTypeLabels,
	type ExperienceLevel,
	type RoleType,
	type SkillTag,
} from "@/data/candidates";
import type { AvailabilityFilter } from "@/lib/candidate-filters";
import { cn } from "@/lib/utils";
import { CustomSelect } from "../CustomSelect";
import { Pill } from "@/components/ui/badge";
import { fieldClass } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/Button";
import { ChevronDownIcon, CloseIcon } from "@/components/ui/icons";

interface CandidatesFilterBarProps {
	availability: AvailabilityFilter;
	onAvailabilityChange: (value: AvailabilityFilter) => void;
	experience: "all" | ExperienceLevel;
	onExperienceChange: (value: "all" | ExperienceLevel) => void;
	role: "all" | RoleType;
	onRoleChange: (value: "all" | RoleType) => void;
	allRoleTypes: RoleType[];
	location: string;
	onLocationChange: (value: string) => void;
	allLocations: string[];
	search: string;
	onSearchChange: (value: string) => void;
	allTags: SkillTag[];
	selectedTags: SkillTag[];
	onToggleTag: (tag: SkillTag) => void;
	onClearTags: () => void;
	tagsExpanded: boolean;
	onTagsExpandedChange: (expanded: boolean) => void;
	resultCount: number;
}

function SrLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
	return (
		<label htmlFor={htmlFor} className="sr-only">
			{children}
		</label>
	);
}

export function CandidatesFilterBar({
	availability,
	onAvailabilityChange,
	experience,
	onExperienceChange,
	role,
	onRoleChange,
	allRoleTypes,
	location,
	onLocationChange,
	allLocations,
	search,
	onSearchChange,
	allTags,
	selectedTags,
	onToggleTag,
	onClearTags,
	tagsExpanded,
	onTagsExpandedChange,
	resultCount,
}: CandidatesFilterBarProps) {
	return (
		<div className="rounded-2xl border border-line bg-surface p-3">
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative min-w-[240px] flex-1">
					<SrLabel htmlFor="candidate-search">Search candidates</SrLabel>
					<input
						id="candidate-search"
						type="text"
						placeholder="Search candidates..."
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className={cn(fieldClass, "w-full pr-11")}
					/>
					{search && (
						<button
							type="button"
							onClick={() => onSearchChange("")}
							className="absolute right-0 top-0 flex size-11 items-center justify-center text-muted hover:text-ink"
							aria-label="Clear search"
						>
							<CloseIcon className="size-4" />
						</button>
					)}
				</div>

				<SrLabel htmlFor="availability-filter">Status</SrLabel>
				<CustomSelect
					id="availability-filter"
					value={availability}
					onChange={(value) => onAvailabilityChange(value as AvailabilityFilter)}
					options={[
						{ value: "active", label: "Available" },
						{ value: "all", label: "All (incl. not looking)" },
						{ value: "looking", label: "Actively Looking" },
						{ value: "open", label: "Open to Opportunities" },
						{ value: "not-looking", label: "Not Currently Looking" },
					]}
					className="min-w-[170px]"
				/>

				<SrLabel htmlFor="experience-filter">Experience</SrLabel>
				<CustomSelect
					id="experience-filter"
					value={experience}
					onChange={(value) => onExperienceChange(value as "all" | ExperienceLevel)}
					options={[
						{ value: "all", label: "All Experience" },
						...(Object.entries(experienceLabels) as [ExperienceLevel, string][]).map(
							([value, label]) => ({ value, label }),
						),
					]}
					className="min-w-[150px]"
				/>

				<SrLabel htmlFor="role-filter">Looking for</SrLabel>
				<CustomSelect
					id="role-filter"
					value={role}
					onChange={(value) => onRoleChange(value as "all" | RoleType)}
					options={[
						{ value: "all", label: "All Roles" },
						...allRoleTypes.map((r) => ({ value: r, label: roleTypeLabels[r] })),
					]}
					className="min-w-[150px]"
				/>

				<SrLabel htmlFor="candidate-location-filter">Location</SrLabel>
				<CustomSelect
					id="candidate-location-filter"
					value={location}
					onChange={onLocationChange}
					options={[
						{ value: "all", label: "All Locations" },
						...allLocations.map((l) => ({ value: l, label: l })),
					]}
					className="min-w-[160px]"
					searchable
				/>

				{allTags.length > 0 && (
					<button
						type="button"
						onClick={() => onTagsExpandedChange(!tagsExpanded)}
						aria-expanded={tagsExpanded}
						aria-controls="candidate-skills-panel"
						className={buttonClass({ variant: "secondary" })}
					>
						Skills{selectedTags.length > 0 && ` (${selectedTags.length})`}
						<ChevronDownIcon className={cn("transition-transform", tagsExpanded && "rotate-180")} />
					</button>
				)}
			</div>

			<div className="mt-2 flex flex-wrap items-center gap-2 px-1">
				<span className="font-mono text-xs text-muted" aria-live="polite">
					{resultCount} {resultCount === 1 ? "candidate" : "candidates"}
				</span>
				{selectedTags.map((tag) => (
					<Pill key={tag} variant="solid" size="lg" className="gap-1">
						{tagLabels[tag] ?? tag}
						<button
							type="button"
							onClick={() => onToggleTag(tag)}
							className="flex size-6 items-center justify-center hover:opacity-70"
							aria-label={`Remove ${tagLabels[tag] ?? tag} filter`}
						>
							<CloseIcon className="size-3.5" />
						</button>
					</Pill>
				))}
				{selectedTags.length > 0 && (
					<button
						type="button"
						onClick={onClearTags}
						className="min-h-11 px-3 text-sm text-muted hover:text-ink"
					>
						Clear all
					</button>
				)}
			</div>

			{tagsExpanded && allTags.length > 0 && (
				<div
					id="candidate-skills-panel"
					data-testid="candidate-skills-panel"
					className="mt-2 flex flex-wrap gap-2 rounded-[10px] border border-line bg-surface-2 p-4"
				>
					{allTags.map((tag) => {
						const selected = selectedTags.includes(tag);
						return (
							<button
								key={tag}
								type="button"
								onClick={() => onToggleTag(tag)}
								aria-pressed={selected}
								className={cn(
									"min-h-11 rounded-full px-4 text-sm font-medium",
									selected
										? "bg-inverse text-inverse-ink"
										: "border border-line-strong bg-surface text-body hover:text-ink",
								)}
							>
								{tagLabels[tag] ?? tag}
							</button>
						);
					})}
					<button
						type="button"
						onClick={() => onTagsExpandedChange(false)}
						className="ml-auto flex min-h-11 items-center gap-1 px-3 text-sm text-muted hover:text-ink"
					>
						<CloseIcon className="size-4" />
						Close
					</button>
				</div>
			)}
		</div>
	);
}
