import { DCBUILDER_SIGNAL, type Candidate } from "@/data/candidates";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/Button";
import {
	DocumentIcon,
	EmailIcon,
	GitHubIcon,
	LinkedInIcon,
	SignalIcon,
	TelegramIcon,
	WebsiteIcon,
	XIcon,
} from "@/components/ui/icons";

interface CandidateContactProps {
	candidate: Candidate;
	onCVClick?: () => void;
	onSocialClick?: (platform: string, url: string) => void;
	onContactClick?: (contactType: "email" | "telegram" | "signal" | "calendly") => void;
}

const chip =
	"inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-medium text-ink hover:opacity-85";
const iconTint: Record<string, string> = { linkedin: "text-[#0a66c2]", telegram: "text-[#229ed9]" };

const SOCIAL_LINKS = [
	{ key: "x", label: "X", Icon: XIcon },
	{ key: "github", label: "GitHub", Icon: GitHubIcon },
	{ key: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
] as const;

const TRAILING_LINKS = [
	{ key: "website", label: "Website", Icon: WebsiteIcon },
	{ key: "telegram", label: "Telegram", Icon: TelegramIcon },
] as const;

/** Contact actions for the profile modal; anonymous profiles route through Signal. */
export function CandidateContact({ candidate, onCVClick, onSocialClick, onContactClick }: CandidateContactProps) {
	if (candidate.visibility === "anonymous") {
		return (
			<a
				href={DCBUILDER_SIGNAL}
				target="_blank"
				rel="noopener noreferrer"
				onClick={() => onContactClick?.("signal")}
				className={buttonClass({ variant: "primary", size: "lg" })}
			>
				<SignalIcon className="size-5" />
				Request Introduction via Signal
			</a>
		);
	}

	const socials = candidate.socials;
	if (!socials) return null;

	const socialLink = ({ key, label, Icon }: (typeof SOCIAL_LINKS | typeof TRAILING_LINKS)[number]) => {
		const url = socials[key];
		if (!url) return null;
		return (
			<a
				key={key}
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				onClick={() => onSocialClick?.(key, url)}
				className={chip}
			>
				<Icon className={cn("size-5", iconTint[key])} />
				{label}
			</a>
		);
	};

	return (
		<div className="flex flex-wrap gap-3">
			{SOCIAL_LINKS.map(socialLink)}
			{socials.email && (
				<a href={`mailto:${socials.email}`} onClick={() => onContactClick?.("email")} className={chip}>
					<EmailIcon className="size-5" />
					Email
				</a>
			)}
			{TRAILING_LINKS.map(socialLink)}
			{socials.cv && (
				<a
					href={socials.cv}
					target="_blank"
					rel="noopener noreferrer"
					onClick={onCVClick}
					className={chip}
				>
					<DocumentIcon className="size-5" />
					View CV / Resume
				</a>
			)}
		</div>
	);
}
