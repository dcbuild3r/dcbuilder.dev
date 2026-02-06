"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Candidate,
  tagLabels,
  availabilityLabels,
  experienceLabels,
  DCBUILDER_TELEGRAM,
} from "@/data/candidates";
import { isNew } from "@/lib/shuffle";

export function ExpandedCandidateView({
	candidate,
	isHot,
	isTop,
	isTopStyle,
	onClose,
	onCVClick,
	onSocialClick,
	onContactClick,
}: {
	candidate: Candidate;
	isHot: boolean;
	isTop: boolean;
	isTopStyle: boolean;
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
		? "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/anonymous-placeholder.svg"
		: candidate.profileImage || "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/anonymous-placeholder.svg";
	const dialogRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const titleId = `candidate-${candidate.id}-title`;
	const descriptionId = `candidate-${candidate.id}-bio`;
	const [copySuccess, setCopySuccess] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		// Trigger open animation after mount
		requestAnimationFrame(() => setIsOpen(true));
	}, []);

	const handleClose = useCallback(() => {
		setIsClosing(true);
		setTimeout(() => {
			onClose();
		}, 300);
	}, [onClose]);

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
						? "sm:ring-2 sm:ring-orange-500 sm:dark:ring-orange-400"
						: isTopStyle
							? "sm:ring-2 sm:ring-violet-500 sm:dark:ring-violet-400"
							: "sm:ring-1 sm:ring-neutral-200 sm:dark:ring-neutral-700"
				}`}
				onClick={(e) => e.stopPropagation()}
			>
					{/* Desktop action buttons - Copy Link and Close */}
				<div className="hidden sm:flex absolute top-4 right-4 z-10 items-center gap-2">
					{/* Copy Link Button */}
					<button
						onClick={handleCopyLink}
						className={`p-2 rounded-full transition-colors active:scale-90 ${
							copySuccess
								? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
								: "bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
						}`}
						aria-label={copySuccess ? "Link copied!" : "Copy link to profile"}
						title={copySuccess ? "Link copied!" : "Copy link to profile"}
					>
						{copySuccess ? (
							<svg
								className="w-6 h-6"
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
								className="w-6 h-6"
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
						onClick={handleClose}
						className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors active:scale-90"
						aria-label="Close profile"
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

				{/* Header Section */}
				<div
					className={`p-6 sm:p-8 ${
						isHot
							? "bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40"
							: isTopStyle
								? "bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40"
								: "bg-neutral-50 dark:bg-neutral-800/50"
					}`}
				>
					{/* Mobile: Copy link and close buttons */}
					<div className="sm:hidden flex items-center justify-end gap-2 mb-4 -mt-2">
						<button
							onClick={handleCopyLink}
							className="p-2.5 rounded-full bg-white/80 dark:bg-neutral-800/80 hover:bg-white dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors active:scale-90"
							aria-label={copySuccess ? "Link copied!" : "Copy link"}
						>
							{copySuccess ? (
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
							ref={closeButtonRef}
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
									e.currentTarget.onerror = null;
									e.currentTarget.src = "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/anonymous-placeholder.svg";
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
							</div>
							<div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
								<p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
									{candidate.title}
								</p>
								{isHot && (
									<span className="px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_0_10px_rgba(251,146,60,0.5)]">
										🔥 HOT
									</span>
								)}
								{isTop && (
									<span className="px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.5)]">
										✨ TOP
									</span>
								)}
								{isNew(candidate.createdAt) && (
									<span className="px-2 py-1 text-xs font-semibold rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 animate-pulse-new">
										NEW
									</span>
								)}
							</div>
							<div className="flex flex-wrap justify-center sm:justify-start gap-2">
								<span
									className={`px-3 py-1 text-sm rounded-full ${availabilityColor[candidate.availability]}`}
								>
									{availabilityLabels[candidate.availability]}
								</span>
								{candidate.experience && (
									<span className="px-3 py-1 text-sm rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
										{experienceLabels[candidate.experience]}
									</span>
								)}
								{candidate.location && (
									<span className="px-3 py-1 text-sm rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
										{candidate.location}
									</span>
								)}
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
				<div className="p-6 sm:p-8 space-y-6 sm:space-y-8 text-center">
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
					{candidate.skills && candidate.skills.length > 0 && (() => {
						const displaySkills = candidate.skills.filter((tag) => tag !== "hot" && tag !== "top");
						return displaySkills.length > 0 && (
							<div>
								<h3 className="text-lg font-semibold mb-3">Skills</h3>
								<div className="flex flex-wrap justify-center gap-2">
									{displaySkills.map((tag) => (
										<span
											key={tag}
											className="px-3 py-1.5 text-sm rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
										>
											{tagLabels[tag] ?? tag}
										</span>
									))}
								</div>
							</div>
						);
					})()}

					{/* Preferred Roles */}
					{candidate.preferredRoles && candidate.preferredRoles.length > 0 && (
						<div>
							<h3 className="text-lg font-semibold mb-3">Looking For</h3>
							<div className="flex flex-wrap justify-center gap-2">
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
							<div className="flex flex-wrap justify-center gap-3">
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
												src={company.logo || "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/anonymous-placeholder.svg"}
												alt={company.name}
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
							<div className="flex flex-wrap justify-center gap-3">
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
