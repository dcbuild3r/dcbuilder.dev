"use client";

import { useState, useEffect, useId } from "react";
import Image from "next/image";
import Markdown from "react-markdown";
import { Job } from "@/data/jobs";
import { ModalShell, useModalClose } from "@/components/ui/ModalShell";
import { Pill } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/Button";
import { PLACEHOLDER_LOGO } from "@/components/jobs/JobRow";
import { getJobTagLabel, normalizeJobTags } from "@/lib/job-tags";
import { isNew } from "@/lib/shuffle";

// Job type labels for display
const jobTypeLabels: Record<string, string> = {
	"full-time": "Full-time",
	"part-time": "Part-time",
	contract: "Contract",
	internship: "Internship",
};

type JobDescriptionContent = {
	description?: string;
};

const jobDescriptionCache = new Map<string, JobDescriptionContent>();

const chip = "inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-medium text-ink hover:opacity-85";
const iconLink = "flex size-11 items-center justify-center rounded-full bg-surface text-ink hover:opacity-85";
const iconProps = {
	className: "size-4",
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	"aria-hidden": true,
} as const;

const CheckIcon = () => (
	<svg {...iconProps} className="size-4 text-accent">
		<polyline points="20 6 9 17 4 12" />
	</svg>
);

function CopyButton({
	copied,
	onCopy,
	label,
	icon,
	iconOnly,
}: {
	copied: boolean;
	onCopy: () => void;
	label: string;
	icon: React.ReactNode;
	iconOnly?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onCopy}
			aria-label={iconOnly ? label : undefined}
			className={iconOnly ? "flex size-11 items-center justify-center rounded-full bg-surface text-body hover:text-ink" : chip}
		>
			{copied ? <CheckIcon /> : icon}
			{!iconOnly && <span>{copied ? "Copied!" : label}</span>}
		</button>
	);
}

const linkIcon = (
	<svg {...iconProps}>
		<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
		<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
	</svg>
);

function CloseButton() {
	const close = useModalClose();
	return (
		<button
			type="button"
			onClick={close}
			aria-label="Close"
			className="flex size-11 items-center justify-center rounded-full bg-surface text-body hover:text-ink"
		>
			<svg {...iconProps} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
				<line x1="18" y1="6" x2="6" y2="18" />
				<line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>
	);
}

// Expanded Job View Component
export function ExpandedJobView({
	job,
	onClose,
	jobUrl,
	onViewOtherJobs,
	otherJobsCount,
	onApplyClick,
	tagLabels,
}: {
	job: Job;
	onClose: () => void;
	jobUrl: string;
	onViewOtherJobs: () => void;
	otherJobsCount: number;
	onApplyClick?: () => void;
	tagLabels: Record<string, string>;
}) {
	const isHot = job.tags?.includes("hot");
	const [copiedLink, setCopiedLink] = useState<"job" | "apply" | null>(null);
	const [enrichedContent, setEnrichedContent] =
		useState<JobDescriptionContent | null>(null);
	const [isEnriching, setIsEnriching] = useState(false);
	const titleId = useId();
	const descriptionId = useId();
	const displayTags = normalizeJobTags(job.tags).filter(
		(tag) => !["hot", "top", "new"].includes(tag),
	);

	// Only enrich if we have no description at all
	const missingSections = !job.description;

	useEffect(() => {
		setEnrichedContent(null);
		if (!missingSections) return;

		const cached = jobDescriptionCache.get(job.id);
		if (cached) {
			setEnrichedContent(cached);
			return;
		}

		let cancelled = false;
		const enrich = async () => {
			setIsEnriching(true);
			try {
				const response = await fetch(
					`/api/job-description?url=${encodeURIComponent(job.link)}`,
				);
				if (!response.ok) return;
				const data = (await response.json()) as JobDescriptionContent;
				if (!cancelled) {
					jobDescriptionCache.set(job.id, data);
					setEnrichedContent(data);
				}
			} catch {
				// Failed to enrich - will show default description
			} finally {
				if (!cancelled) setIsEnriching(false);
			}
		};

		void enrich();

		return () => {
			cancelled = true;
		};
	}, [job.id, job.link, missingSections]);

	const loadingLabel = "Fetching details from job link...";
	const defaultBullet = "Details will be shared during the process.";
	const sections: Array<{ heading: string; items: string[] }> = [
		{ heading: "What you'll do", items: job.responsibilities ?? [] },
		{ heading: "What we're looking for", items: job.qualifications ?? [] },
		{ heading: "What we offer", items: job.benefits ?? [] },
	].filter((section) => section.items.length > 0);
	const sectionMarkdown = sections
		.map(
			(section) =>
				`## ${section.heading}\n\n${section.items.map((item) => `- ${item}`).join("\n")}`,
		)
		.join("\n\n");
	const descriptionParts = [
		job.description?.trim(),
		sectionMarkdown || undefined,
		enrichedContent?.description?.trim(),
	].filter(Boolean);
	const description =
		descriptionParts.join("\n\n") ||
		(isEnriching ? loadingLabel : defaultBullet);

	const copyToClipboard = async (text: string, type: "job" | "apply") => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedLink(type);
			setTimeout(() => setCopiedLink(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	return (
		<ModalShell open onClose={onClose} labelledBy={titleId} describedBy={descriptionId} className="sm:rounded-[20px]">
			<div className="relative bg-surface-2 p-6 pt-9 sm:p-8">
				<div className="absolute right-4 top-4 z-[2] flex gap-2">
					<CopyButton
						iconOnly
						label="Copy link"
						copied={copiedLink === "job"}
						onCopy={() => copyToClipboard(jobUrl, "job")}
						icon={linkIcon}
					/>
					<CloseButton />
				</div>

				<div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
					<Image
						src={job.company.logo || PLACEHOLDER_LOGO}
						alt={job.company.name}
						width={96}
						height={96}
						className="size-20 shrink-0 rounded-[18px] bg-white object-contain sm:size-24"
						onError={(e) => {
							e.currentTarget.onerror = null;
							e.currentTarget.src = PLACEHOLDER_LOGO;
						}}
					/>

					<div className="flex-1">
						<h2 id={titleId} className="mb-1 text-[clamp(22px,3.2vw,30px)] font-bold leading-tight tracking-[-0.025em] text-ink sm:pr-24">
							{job.title}
						</h2>
						<p className="mb-2 text-base text-body sm:text-lg">{job.company.name}</p>
						<p className="mb-3 font-mono text-xs leading-relaxed text-muted">
							{job.location}
							{job.remote && " · Remote OK"}
							{job.type && ` · ${jobTypeLabels[job.type] ?? job.type}`}
							{job.department && ` · ${job.department}`}
							{job.salary && ` · ${job.salary}`}
						</p>
						<div className="flex flex-wrap justify-center gap-2 sm:justify-start">
							{isHot && <Pill size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 font-semibold text-white shadow-[0_0_10px_rgb(251_146_60/0.5)]">Hot</Pill>}
							{job.featured && <Pill variant="warm" size="lg">Featured</Pill>}
							{job.tags?.includes("top") && <Pill variant="solid" size="lg">Top</Pill>}
							{isNew(job.createdAt) && <Pill variant="outline" size="lg">New</Pill>}
							<Pill variant={job.company.category === "portfolio" ? "accent" : "neutral"} size="lg">
								{job.company.category === "portfolio" ? "Portfolio" : "Network"}
							</Pill>
						</div>

						<div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
							<a
								href={job.link}
								target="_blank"
								rel="noopener noreferrer"
								onClick={onApplyClick}
								className={buttonClass({ variant: "primary", size: "lg", className: "rounded-full" })}
							>
								Apply Now ↗
							</a>
							<a href={job.company.website} target="_blank" rel="noopener noreferrer" aria-label="Website" className={iconLink}>
								<svg {...iconProps}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
							</a>
							{job.company.x && (
								<a href={job.company.x} target="_blank" rel="noopener noreferrer" aria-label="X" className={iconLink}>
									<svg {...iconProps} fill="currentColor" stroke="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
								</a>
							)}
							{job.company.github && (
								<a href={job.company.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={iconLink}>
									<svg {...iconProps} fill="currentColor" stroke="none"><path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .5z" /></svg>
								</a>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="space-y-6 p-6 sm:space-y-8 sm:p-8">
				{displayTags.length > 0 && (
					<div>
						<h3 className="mb-3 text-lg font-semibold text-ink">Tags</h3>
						<div className="flex flex-wrap gap-2">
							{displayTags.map((tag) => (
								<Pill key={tag} size="lg">
									{getJobTagLabel(tag, tagLabels)}
								</Pill>
							))}
						</div>
					</div>
				)}

				<div>
					<h3 className="mb-3 text-lg font-semibold text-ink">About the Role</h3>
					<div id={descriptionId} className="prose-jd">
						<Markdown>{description}</Markdown>
					</div>
				</div>

				<div className="border-t border-line pt-6">
					<div className="flex flex-wrap gap-2">
						<CopyButton
							label="Copy link"
							copied={copiedLink === "job"}
							onCopy={() => copyToClipboard(jobUrl, "job")}
							icon={
								<svg {...iconProps}>
									<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
									<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
								</svg>
							}
						/>
						<CopyButton
							label="Copy apply link"
							copied={copiedLink === "apply"}
							onCopy={() => copyToClipboard(job.link, "apply")}
							icon={
								<svg {...iconProps}>
									<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
									<polyline points="15 3 21 3 21 9" />
									<line x1="10" y1="14" x2="21" y2="3" />
								</svg>
							}
						/>
						{otherJobsCount > 0 && (
							<button type="button" onClick={onViewOtherJobs} className={chip}>
								{otherJobsCount} more {otherJobsCount === 1 ? "job" : "jobs"}
							</button>
						)}
						{job.company.careers && (
							<a href={job.company.careers} target="_blank" rel="noopener noreferrer" className={chip}>
								Careers page
							</a>
						)}
					</div>
				</div>
			</div>
		</ModalShell>
	);
}
