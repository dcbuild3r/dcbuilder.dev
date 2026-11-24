"use client";

import { memo } from "react";
import Image from "next/image";
import ReactMarkdown, { type Components } from "react-markdown";
import { tagLabels, experienceLabels, DCBUILDER_SIGNAL, type Candidate } from "@/data/candidates";
import { cn } from "@/lib/utils";
import { getCandidateDisplayName } from "@/lib/candidate-filters";
import { Pill } from "@/components/ui/badge";
import { getSkillColor } from "@/lib/skill-colors";
import { buttonClass } from "@/components/ui/Button";
import { SocialLinks } from "@/components/ui/social-links";
import { CandidatePills } from "./CandidatePills";
import { ANONYMOUS_PLACEHOLDER } from "./candidate-assets";

const cardBioMarkdownComponents: Components = {
	a: ({ children, href }) => (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="font-medium text-ink underline underline-offset-4 hover:text-accent"
		>
			{children}
		</a>
	),
	p: ({ children }) => <span>{children}</span>,
};

const MAX_SKILLS = 4;

interface CandidateCardProps {
	candidate: Candidate;
	isHot: boolean;
	isTop: boolean;
	isTopStyle: boolean;
	onExpand: () => void;
}

/** Memoized so large lists do not re-render every card on unrelated state changes. */
export const CandidateCard = memo(function CandidateCard({
	candidate,
	isHot,
	isTop,
	isTopStyle,
	onExpand,
}: CandidateCardProps) {
	const isAnonymous = candidate.visibility === "anonymous";
	const displayName = getCandidateDisplayName(candidate);
	const profileImage = isAnonymous
		? ANONYMOUS_PLACEHOLDER
		: candidate.profileImage || ANONYMOUS_PLACEHOLDER;
	const displaySkills = (candidate.skills || []).filter((tag) => tag !== "hot" && tag !== "top");
	const meta = [candidate.location, candidate.remote ? "Remote OK" : null, candidate.experience ? experienceLabels[candidate.experience] : null]
		.filter(Boolean)
		.join(" · ");

	return (
		<article
			data-testid="candidate-card"
			className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6"
		>
			<div className="flex items-center gap-4">
				<div className="size-16 shrink-0 overflow-hidden rounded-full border border-line bg-surface-2">
					<Image
						src={profileImage}
						alt=""
						width={64}
						height={64}
						className="size-full object-cover"
						onError={(e) => {
							e.currentTarget.onerror = null;
							e.currentTarget.src = ANONYMOUS_PLACEHOLDER;
						}}
					/>
				</div>
				<div className="min-w-0">
					<h2 className="text-lg font-semibold leading-snug tracking-[-0.015em] text-ink">
						{displayName}
					</h2>
					<p className="text-[14.5px] text-body">{candidate.title}</p>
				</div>
			</div>

			<div className="flex flex-wrap gap-1.5">
				<CandidatePills candidate={candidate} isHot={isHot} isTop={isTop} isTopStyle={isTopStyle} />
			</div>

			<div className="line-clamp-3 text-[14.5px] leading-relaxed text-body">
				<ReactMarkdown components={cardBioMarkdownComponents}>{candidate.bio}</ReactMarkdown>
			</div>

			{meta && <p className="font-mono text-xs text-muted">{meta}</p>}

			{displaySkills.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{displaySkills.slice(0, MAX_SKILLS).map((tag) => (
						<Pill key={tag} variant="neutral" className={cn("px-2.5 py-[3px] text-[12.5px]", getSkillColor(tag))}>
							{tagLabels[tag] ?? tag}
						</Pill>
					))}
					{displaySkills.length > MAX_SKILLS && (
						<span className="px-1 py-[3px] text-[12.5px] text-muted">
							+{displaySkills.length - MAX_SKILLS}
						</span>
					)}
				</div>
			)}

			<div className="mt-auto flex flex-col gap-2 pt-4">
				{candidate.socials && !isAnonymous && (
					<SocialLinks
						socials={candidate.socials}
						displayName={displayName}
						variant="compact"
						className="-ml-[13px] flex-wrap"
					/>
				)}
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={onExpand}
						aria-label={`View profile: ${displayName}`}
						className={buttonClass({ variant: "primary" })}
					>
						View profile
					</button>
					{isAnonymous && (
						<a href={DCBUILDER_SIGNAL} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: "secondary" })}>
							Request introduction ↗
						</a>
					)}
				</div>
			</div>
		</article>
	);
});
