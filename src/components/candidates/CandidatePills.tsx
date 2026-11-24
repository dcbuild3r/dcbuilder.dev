import { availabilityLabels, type Candidate } from "@/data/candidates";
import { isNew } from "@/lib/shuffle";
import { Pill } from "@/components/ui/badge";

/** Vouched/Referred, Featured, TOP/HOT, NEW and availability pills shared by card and modal. */
export function CandidatePills({
	candidate,
	isHot,
	isTop,
	isTopStyle,
}: {
	candidate: Candidate;
	isHot: boolean;
	isTop: boolean;
	/** Hot data loaded; before that TOP stays outlined so it never flips next to a late HOT. */
	isTopStyle: boolean;
}) {
	return (
		<>
			{isTop && (
				<Pill
					variant={isTopStyle || isHot ? "solid" : "outline"}
					className={isTopStyle || isHot ? "bg-gradient-to-r from-violet-500 to-purple-500 font-semibold text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]" : undefined}
				>
					TOP
				</Pill>
			)}
			{isHot && <Pill variant="warm">HOT</Pill>}
			{candidate.featured && <Pill variant="accent">Featured</Pill>}
			{candidate.vouched !== false ? (
				<Pill variant="accent" title="I personally know this candidate">
					Vouched
				</Pill>
			) : (
				<Pill variant="outline" title="Not personally known, proceed with caution">
					Referred
				</Pill>
			)}
			<Pill
				variant={candidate.availability === "not-looking" ? "neutral" : "outline"}
				className={candidate.availability === "looking" ? "border-0 bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" : undefined}
			>
				{availabilityLabels[candidate.availability]}
			</Pill>
			{isNew(candidate.createdAt) && <Pill variant="outline">NEW</Pill>}
		</>
	);
}
