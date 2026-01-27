// Import JobTag from jobs for skill consistency
import { JobTag, tagLabels } from "./jobs";

export { tagLabels };
export type { JobTag };

export type AvailabilityStatus = "looking" | "open" | "not-looking";
export type VisibilityMode = "public" | "anonymous";
export type ExperienceLevel = "0-1" | "1-3" | "3-5" | "5-10" | "10+";
export type CandidateTier = 1 | 2 | 3 | 4;

export const availabilityLabels: Record<AvailabilityStatus, string> = {
	looking: "Actively Looking",
	open: "Open to Opportunities",
	"not-looking": "Not Currently Looking",
};

export const experienceLabels: Record<ExperienceLevel, string> = {
	"0-1": "0-1 years",
	"1-3": "1-3 years",
	"3-5": "3-5 years",
	"5-10": "5-10 years",
	"10+": "10+ years",
};

export interface SocialLinks {
	twitter?: string;
	github?: string;
	linkedin?: string;
	email?: string;
	website?: string;
	telegram?: string;
	cv?: string;
}

export interface Achievement {
	title: string;
	description?: string;
	url?: string;
}

export interface CompanyReference {
	name: string;
	logo?: string;
	url?: string;
}

export interface Candidate {
	id: string;
	visibility: VisibilityMode;
	name: string;
	anonymousAlias?: string;
	title: string;
	bio: string;
	profileImage?: string;
	skills: JobTag[];
	location: string;
	remote: boolean;
	experience: ExperienceLevel;
	availability: AvailabilityStatus;
	preferredRoles: string[];
	achievements?: Achievement[];
	companies?: CompanyReference[];
	socials?: SocialLinks;
	tier: CandidateTier;
	featured: boolean;
	hot?: boolean;
	vouched?: boolean; // true = personally known/vouched, false/undefined = not personally known
	dateAdded?: string;
}

export const DCBUILDER_TELEGRAM = "https://t.me/dcbuilder";

export const candidates: Candidate[] = [
	{
		id: "norswap",
		visibility: "public",
		name: "Norswap",
		title: "Tech Lead / Protocol Engineer",
		bio: "Experienced crypto tech leader with strong track record in protocol design at Optimism and leading teams to ship at Happy Devs. Open to tech leadership, VC investment roles, or co-founding opportunities.",
		profileImage: "/images/candidates/norswap.jpg",
		skills: ["top", "protocol", "infra", "vc", "research"],
		location: "Remote",
		remote: true,
		experience: "10+",
		availability: "looking",
		preferredRoles: [
			"Head of Engineering",
			"Tech Lead",
			"Engineering Manager",
			"VC Investment",
			"Co-founder",
		],
		companies: [
			{ name: "Optimism", url: "https://optimism.io" },
			{ name: "Happy Devs", url: "https://docs.happy.tech/" },
		],
		socials: {
			twitter: "https://x.com/norswap",
			github: "https://github.com/norswap",
			linkedin: "https://linkedin.com/in/norswap",
			telegram: "https://t.me/norswap",
			email: "norswap@gmail.com",
			website: "https://norswap.com",
			cv: "https://norswap.com/resume/",
		},
		tier: 1,
		featured: true,
		hot: true,
		vouched: true,
		dateAdded: "2025-01-27",
	},
];
