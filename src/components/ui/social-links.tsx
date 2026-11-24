"use client";

import { cn } from "@/lib/utils";
import {
	XIcon,
	GitHubIcon,
	LinkedInIcon,
	TelegramIcon,
	EmailIcon,
	WebsiteIcon,
	DocumentIcon,
} from "./icons";

interface Socials {
	x?: string;
	github?: string;
	linkedin?: string;
	telegram?: string;
	email?: string;
	website?: string;
	cv?: string;
}

interface SocialLinksProps {
	socials: Socials;
	displayName: string;
	variant?: "compact" | "expanded";
	onSocialClick?: (platform: string, url: string) => void;
	onCVClick?: () => void;
	className?: string;
}

const linkBaseStyles = "text-muted hover:text-ink transition-colors";
const compactLinkStyles = "inline-flex size-11 items-center justify-center";
const expandedLinkStyles =
	"flex min-h-11 items-center gap-2 rounded-[10px] bg-surface-2 px-4 text-ink hover:bg-line";

/**
 * Reusable social links component with consistent styling and accessibility.
 * Supports both compact (icons only) and expanded (icons with labels) variants.
 */
export function SocialLinks({
	socials,
	displayName,
	variant = "compact",
	onSocialClick,
	onCVClick,
	className,
}: SocialLinksProps) {
	const isCompact = variant === "compact";
	const linkStyles = isCompact
		? cn(linkBaseStyles, compactLinkStyles)
		: expandedLinkStyles;
	const iconSize = isCompact ? "size-[18px]" : "size-5";

	return (
		<div
			className={cn(
				"flex items-center",
				isCompact ? "gap-1" : "flex-wrap justify-center gap-3",
				className
			)}
		>
			{socials.x && (
				<a
					href={socials.x}
					target="_blank"
					rel="noopener noreferrer"
					onClick={() => onSocialClick?.("x", socials.x!)}
					className={linkStyles}
					title="X"
					aria-label={`X profile for ${displayName}`}
				>
					<XIcon className={iconSize} />
					{!isCompact && <span>X</span>}
				</a>
			)}

			{socials.github && (
				<a
					href={socials.github}
					target="_blank"
					rel="noopener noreferrer"
					onClick={() => onSocialClick?.("github", socials.github!)}
					className={linkStyles}
					title="GitHub"
					aria-label={`GitHub profile for ${displayName}`}
				>
					<GitHubIcon className={iconSize} />
					{!isCompact && <span>GitHub</span>}
				</a>
			)}

			{socials.linkedin && (
				<a
					href={socials.linkedin}
					target="_blank"
					rel="noopener noreferrer"
					onClick={() => onSocialClick?.("linkedin", socials.linkedin!)}
					className={linkStyles}
					title="LinkedIn"
					aria-label={`LinkedIn profile for ${displayName}`}
				>
					<LinkedInIcon className={iconSize} />
					{!isCompact && <span>LinkedIn</span>}
				</a>
			)}

			{socials.email && (
				<a
					href={`mailto:${socials.email}`}
					onClick={() => onSocialClick?.("email", socials.email!)}
					className={linkStyles}
					title="Email"
					aria-label={`Email ${displayName}`}
				>
					<EmailIcon className={iconSize} />
					{!isCompact && <span>Email</span>}
				</a>
			)}

			{socials.website && (
				<a
					href={socials.website}
					target="_blank"
					rel="noopener noreferrer"
					onClick={() => onSocialClick?.("website", socials.website!)}
					className={linkStyles}
					title="Website"
					aria-label={`Website for ${displayName}`}
				>
					<WebsiteIcon className={iconSize} />
					{!isCompact && <span>Website</span>}
				</a>
			)}

			{socials.telegram && (
				<a
					href={socials.telegram}
					target="_blank"
					rel="noopener noreferrer"
					onClick={() => onSocialClick?.("telegram", socials.telegram!)}
					className={linkStyles}
					title="Telegram"
					aria-label={`Telegram for ${displayName}`}
				>
					<TelegramIcon className={iconSize} />
					{!isCompact && <span>Telegram</span>}
				</a>
			)}

			{socials.cv && (
				<a
					href={socials.cv}
					target="_blank"
					rel="noopener noreferrer"
					onClick={onCVClick}
					className={cn(
						linkStyles,
						!isCompact && "bg-accent text-white hover:opacity-85"
					)}
					title="CV / Resume"
					aria-label={`CV or resume for ${displayName}`}
				>
					<DocumentIcon className={iconSize} />
					{!isCompact && <span>View CV / Resume</span>}
				</a>
			)}
		</div>
	);
}
