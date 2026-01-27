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
	dateAdded?: string;
}

export const DCBUILDER_TELEGRAM = "https://t.me/dcbuilder";

export const candidates: Candidate[] = [];
