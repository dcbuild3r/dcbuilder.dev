"use client";

import { useState, useEffect, useCallback, useRef, useId } from "react";
import Image from "next/image";
import Markdown from "react-markdown";
import { Job } from "@/data/jobs";
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
	const dialogRef = useRef<HTMLDivElement>(null);
	const [copiedLink, setCopiedLink] = useState<"job" | "apply" | null>(null);
	const [enrichedContent, setEnrichedContent] =
		useState<JobDescriptionContent | null>(null);
	const [isEnriching, setIsEnriching] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const titleId = useId();
	const descriptionId = useId();

	useEffect(() => {
		// Trigger open animation after mount
		requestAnimationFrame(() => setIsOpen(true));
	}, []);

	useEffect(() => {
		if (isOpen) {
			dialogRef.current?.focus();
		}
	}, [isOpen]);

	const handleClose = useCallback(() => {
		setIsClosing(true);
		setTimeout(() => {
			onClose();
		}, 300);
	}, [onClose]);
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
	const description =
		job.description?.trim() ||
		enrichedContent?.description?.trim() ||
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

	const handleDialogKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			handleClose();
			return;
		}
		if (e.key !== "Tab") return;

		const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
			'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
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
	}, [handleClose]);

	return (
		<div
			className={`fixed inset-0 z-50 min-h-screen flex sm:items-center sm:justify-center backdrop-blur-sm transition-colors duration-300 ${
				isClosing ? "bg-black/0" : isOpen ? "bg-black/50" : "bg-black/0"
			}`}
			onClick={handleClose}
		>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				aria-describedby={descriptionId}
				tabIndex={-1}
				onKeyDown={handleDialogKeyDown}
				className={`fixed inset-0 sm:relative sm:inset-auto w-full h-[100dvh] sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto sm:rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl transition-[transform,opacity] duration-300 ${
					isClosing
						? "translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0 ease-out"
						: isOpen
							? "translate-y-0 sm:scale-100 sm:opacity-100 ease-out"
							: "translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0 ease-in"
				} ${
					isHot
						? "sm:ring-2 sm:ring-orange-400 sm:dark:ring-orange-500"
						: "sm:ring-1 sm:ring-neutral-200 sm:dark:ring-neutral-700"
				}`}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header Section - with drag handle inside */}
				<div
					className={`p-6 sm:p-8 ${
						isHot
							? "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30"
							: "bg-neutral-50 dark:bg-neutral-800/50"
					}`}
				>
					{/* Mobile: Copy link and close buttons */}
					<div className="sm:hidden flex items-center justify-end gap-2 mb-4 -mt-2">
						<button
							onClick={() => copyToClipboard(jobUrl, "job")}
							className="p-2.5 rounded-full bg-white/80 dark:bg-neutral-800/80 hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors active:scale-90"
							aria-label="Copy link"
						>
							{copiedLink === "job" ? (
								<svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							) : (
								<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
									<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
								</svg>
							)}
						</button>
						<button
							onClick={handleClose}
							className="p-2.5 rounded-full bg-white/80 dark:bg-neutral-800/80 hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors active:scale-90"
							aria-label="Close"
						>
							<svg
								className="w-6 h-6"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>

					{/* Desktop: Copy link and close buttons */}
					<div className="hidden sm:flex absolute top-4 right-4 z-10 gap-2">
						<button
							onClick={() => copyToClipboard(jobUrl, "job")}
							className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors active:scale-90"
							aria-label="Copy link"
						>
							{copiedLink === "job" ? (
								<svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<polyline points="20 6 9 17 4 12" />
								</svg>
							) : (
								<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
									<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
								</svg>
							)}
						</button>
						<button
							onClick={handleClose}
							className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors active:scale-90"
							aria-label="Close"
						>
							<svg
								className="w-6 h-6"
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

					<div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
						{/* Company Logo */}
						<div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-white p-2 ring-2 ring-neutral-200 dark:ring-neutral-700 hover:scale-[1.08] transition-transform duration-150">
							<Image
								src={job.company.logo || "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/anonymous-placeholder.svg"}
								alt={job.company.name}
								width={96}
								height={96}
								className="object-contain w-full h-full"
								onError={(e) => {
									e.currentTarget.onerror = null;
									e.currentTarget.src = "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/anonymous-placeholder.svg";
								}}
							/>
						</div>

						<div className="flex-1">
							{/* 1. Title */}
							<h2 id={titleId} className="text-xl sm:text-3xl font-bold mb-1">
								{job.title}
								{job.featured && (
									<span className="ml-2 text-lg text-amber-600 dark:text-amber-400">★</span>
								)}
							</h2>
							{/* 2. Company */}
							<p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 mb-2">
								{job.company.name}
							</p>
							{/* 3. Location + 4. Type, Team, Comp (as text, not tag-like) */}
							<p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
								{job.location}
								{job.remote && " · Remote OK"}
								{job.type && ` · ${jobTypeLabels[job.type] ?? job.type}`}
								{job.department && ` · ${job.department}`}
								{job.salary && ` · ${job.salary}`}
							</p>
							{/* 5. HOT/NEW/TOP badges + 6. Network/Portfolio */}
							<div className="flex flex-wrap justify-center sm:justify-start gap-2">
								{isHot && (
									<span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_10px_rgba(251,146,60,0.5)]">
										🔥 HOT
									</span>
								)}
								{job.tags?.includes("top") && (
									<span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white">
										TOP
									</span>
								)}
								{isNew(job.createdAt) && (
									<span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 animate-pulse-new">
										NEW
									</span>
								)}
								<span
									className={`px-3 py-1 text-sm rounded-full ${
										job.company.category === "portfolio"
											? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
											: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
									}`}
								>
									{job.company.category === "portfolio" ? "Portfolio" : "Network"}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Content Section */}
				<div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
					{/* Tags - exclude hot, top, new as they're shown in header */}
					{job.tags && job.tags.filter(t => !["hot", "top", "new"].includes(t)).length > 0 && (
						<div>
							<h3 className="text-lg font-semibold mb-3">Tags</h3>
							<div className="flex flex-wrap gap-2">
								{job.tags.filter(t => !["hot", "top", "new"].includes(t)).map((tag) => (
									<span
										key={tag}
										className="px-3 py-1.5 text-sm rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
									>
										{tagLabels[tag] ?? tag}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Description */}
					<div>
						<h3 className="text-lg font-semibold mb-3">About the Role</h3>
						<div id={descriptionId} className="prose-jd">
							<Markdown>{description}</Markdown>
						</div>
					</div>

					{/* Actions Section - scrollable with content */}
					<div className="pt-6 border-t border-neutral-200 dark:border-neutral-700 space-y-4">
						{/* Apply Button */}
						<a
							href={job.link}
							target="_blank"
							rel="noopener noreferrer"
							onClick={onApplyClick}
							className="block w-full px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors text-center"
						>
							Apply Now →
						</a>

						{/* Copy Buttons - with labels */}
						<div className="flex flex-wrap justify-center gap-2">
							<button
								onClick={() => copyToClipboard(jobUrl, "job")}
								className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
							>
								{copiedLink === "job" ? (
									<>
										<svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<polyline points="20 6 9 17 4 12" />
										</svg>
										<span className="text-green-600 dark:text-green-400">Copied!</span>
									</>
								) : (
									<>
										<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
											<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
										</svg>
										<span>Copy link</span>
									</>
								)}
							</button>
							<button
								onClick={() => copyToClipboard(job.link, "apply")}
								className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
							>
								{copiedLink === "apply" ? (
									<>
										<svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<polyline points="20 6 9 17 4 12" />
										</svg>
										<span className="text-green-600 dark:text-green-400">Copied!</span>
									</>
								) : (
									<>
										<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
											<polyline points="15 3 21 3 21 9" />
											<line x1="10" y1="14" x2="21" y2="3" />
										</svg>
										<span>Copy apply link</span>
									</>
								)}
							</button>
						</div>

						{/* Other Jobs & Careers - with labels */}
						<div className="flex flex-wrap justify-center gap-2">
							{otherJobsCount > 0 && (
								<button
									onClick={onViewOtherJobs}
									className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
								>
									<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<rect x="3" y="3" width="7" height="7" />
										<rect x="14" y="3" width="7" height="7" />
										<rect x="14" y="14" width="7" height="7" />
										<rect x="3" y="14" width="7" height="7" />
									</svg>
									<span>{otherJobsCount} more {otherJobsCount === 1 ? "job" : "jobs"}</span>
								</button>
							)}
							{job.company.careers && (
								<a
									href={job.company.careers}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
								>
									<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
										<circle cx="12" cy="7" r="4" />
									</svg>
									<span>Careers page</span>
								</a>
							)}
						</div>

						{/* Company Links - with labels */}
						<div className="flex flex-wrap justify-center gap-2">
							<a
								href={job.company.website}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
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
								<span>Website</span>
							</a>
							{job.company.x && (
								<a
									href={job.company.x}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
								>
									<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
										<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
									</svg>
									<span>X</span>
								</a>
							)}
							{job.company.github && (
								<a
									href={job.company.github}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
								>
									<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
									</svg>
									<span>GitHub</span>
								</a>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
