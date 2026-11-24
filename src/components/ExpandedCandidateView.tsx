"use client";

import remarkGfm from "remark-gfm";

import { useCallback, useState } from "react";
import Image from "next/image";
import ReactMarkdown, { type Components } from "react-markdown";
import { tagLabels, experienceLabels, type Candidate } from "@/data/candidates";
import { getCandidateDisplayName } from "@/lib/candidate-filters";
import { Pill } from "@/components/ui/badge";
import { getSkillColor } from "@/lib/skill-colors";
import { cn } from "@/lib/utils";
import { CheckIcon, CloseIcon, LinkIcon } from "@/components/ui/icons";
import { ModalShell, useModalClose } from "@/components/ui/ModalShell";
import { CandidatePills } from "./candidates/CandidatePills";
import { CandidateContact } from "./candidates/CandidateContact";
import { ANONYMOUS_PLACEHOLDER } from "./candidates/candidate-assets";

const bioMarkdownComponents: Components = {
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
	p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
};

interface ExpandedCandidateViewProps {
	candidate: Candidate;
	isHot: boolean;
	isTop: boolean;
	isTopStyle: boolean;
	onClose: () => void;
	onCVClick?: () => void;
	onSocialClick?: (platform: string, url: string) => void;
	onContactClick?: (contactType: "email" | "telegram" | "signal" | "calendly") => void;
}

const iconButton =
	"flex size-11 items-center justify-center rounded-full bg-surface text-body hover:text-ink active:scale-90 transition-colors";

function SectionTitle({ children }: { children: React.ReactNode }) {
	return <h3 className="mb-3 text-lg font-semibold text-ink">{children}</h3>;
}

function ProfileBody({
	candidate,
	isHot,
	isTop,
	isTopStyle,
	onCVClick,
	onSocialClick,
	onContactClick,
	titleId,
	descriptionId,
}: Omit<ExpandedCandidateViewProps, "onClose"> & { titleId: string; descriptionId: string }) {
	const close = useModalClose();
	const [copySuccess, setCopySuccess] = useState(false);
	const isAnonymous = candidate.visibility === "anonymous";
	const displayName = getCandidateDisplayName(candidate);
	const profileImage = isAnonymous
		? ANONYMOUS_PLACEHOLDER
		: candidate.profileImage || ANONYMOUS_PLACEHOLDER;
	const displaySkills = (candidate.skills || []).filter((tag) => tag !== "hot" && tag !== "top");

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

	return (
		<>
			<div className="bg-gradient-to-r from-violet-50 to-blue-50 p-6 pt-14 dark:from-violet-500/10 dark:to-blue-500/10 sm:p-8">
				<div className="absolute right-4 top-4 z-10 flex items-center gap-2">
					<button
						type="button"
						onClick={handleCopyLink}
						className={iconButton}
						aria-label={copySuccess ? "Link copied!" : "Copy link to profile"}
						title={copySuccess ? "Link copied!" : "Copy link to profile"}
					>
						{copySuccess ? <CheckIcon className="size-5 text-accent" /> : <LinkIcon className="size-5" />}
					</button>
					<button type="button" onClick={close} className={iconButton} aria-label="Close profile">
						<CloseIcon className="size-5" />
					</button>
				</div>

				<div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
					<div className="size-20 shrink-0 overflow-hidden rounded-full border-4 border-surface bg-surface sm:size-32">
						<Image
							src={profileImage}
							alt={displayName}
							width={128}
							height={128}
							className="size-full object-cover"
							onError={(e) => {
								e.currentTarget.onerror = null;
								e.currentTarget.src = ANONYMOUS_PLACEHOLDER;
							}}
						/>
					</div>

					<div className="flex-1">
						<h2 id={titleId} className="text-[clamp(22px,3.2vw,30px)] font-bold leading-tight tracking-[-0.025em] text-ink">
							{displayName}
						</h2>
						<p className="mt-1.5 text-[17px] text-body">{candidate.title}</p>
						<div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
							<CandidatePills candidate={candidate} isHot={isHot} isTop={isTop} isTopStyle={isTopStyle} />
							{candidate.experience && (
								<Pill variant="neutral">{experienceLabels[candidate.experience]}</Pill>
							)}
							{candidate.location && <Pill variant="neutral">{candidate.location}</Pill>}
							{candidate.remote && <Pill variant="accent">Remote OK</Pill>}
						</div>
					</div>
				</div>
			</div>

			<div className="space-y-7 p-6 sm:p-8">
				<div>
					<SectionTitle>About</SectionTitle>
					<div id={descriptionId} className="leading-relaxed text-body">
						<ReactMarkdown remarkPlugins={[remarkGfm]} components={bioMarkdownComponents}>{candidate.bio}</ReactMarkdown>
					</div>
				</div>

				{displaySkills.length > 0 && (
					<div>
						<SectionTitle>Skills</SectionTitle>
						<div className="flex flex-wrap gap-2">
							{displaySkills.map((tag) => (
								<Pill key={tag} variant="neutral" size="lg" className={cn("px-3 py-[5px] text-sm", getSkillColor(tag))}>
									{tagLabels[tag] ?? tag}
								</Pill>
							))}
						</div>
					</div>
				)}

				{candidate.preferredRoles && candidate.preferredRoles.length > 0 && (
					<div>
						<SectionTitle>Looking For</SectionTitle>
						<div className="flex flex-wrap gap-2">
							{candidate.preferredRoles.map((role) => (
								<Pill key={role} variant="accent" size="lg">
									{role}
								</Pill>
							))}
						</div>
					</div>
				)}

				{candidate.companies && candidate.companies.length > 0 && (
					<div>
						<SectionTitle>Experience</SectionTitle>
						<div className="flex flex-wrap gap-2">
							{candidate.companies.map((company) => (
								<a
									key={company.name}
									href={company.url}
									target="_blank"
									rel="noopener noreferrer"
									className="flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm text-ink hover:opacity-85"
								>
									{company.logo && (
										<Image
											src={company.logo}
											alt=""
											width={24}
											height={24}
											className="rounded"
											onError={(e) => {
												e.currentTarget.onerror = null;
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

				{candidate.achievements && candidate.achievements.length > 0 && (
					<div>
						<SectionTitle>Achievements</SectionTitle>
						<ul className="space-y-3 text-left">
							{candidate.achievements.map((achievement, i) => (
								<li key={i} className="flex items-start gap-3">
									<span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
									<div>
										{achievement.url ? (
											<a
												href={achievement.url}
												target="_blank"
												rel="noopener noreferrer"
												className="font-medium text-ink hover:underline"
											>
												{achievement.title}
											</a>
										) : (
											<span className="font-medium text-ink">{achievement.title}</span>
										)}
										{achievement.description && (
											<p className="text-sm text-muted">{achievement.description}</p>
										)}
									</div>
								</li>
							))}
						</ul>
					</div>
				)}

				<div>
					<h3 className="mb-4 text-lg font-semibold text-ink">Get in Touch</h3>
					<div className="flex">
						<CandidateContact
							candidate={candidate}
							onCVClick={onCVClick}
							onSocialClick={onSocialClick}
							onContactClick={onContactClick}
						/>
					</div>
				</div>
			</div>
		</>
	);
}

export function ExpandedCandidateView({ onClose, ...props }: ExpandedCandidateViewProps) {
	const titleId = `candidate-${props.candidate.id}-title`;
	const descriptionId = `candidate-${props.candidate.id}-bio`;

	return (
		<ModalShell open onClose={onClose} labelledBy={titleId} describedBy={descriptionId} className="sm:rounded-[20px]">
			<ProfileBody {...props} titleId={titleId} descriptionId={descriptionId} />
		</ModalShell>
	);
}
