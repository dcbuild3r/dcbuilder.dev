/**
 * Candidate type definitions and labels
 * Data is fetched from the database - see src/db/schema/candidates.ts
 */

// Import JobTag from jobs for skill consistency
import { JobTag, tagLabels as jobTagLabels } from "./jobs";

export type { JobTag };

// Candidate-specific skill tags (not used for job listings)
export type CandidateTag =
	| "reth"
	| "alloy"
	| "web3-devtools"
	| "solidity"
	| "typescript"
	| "rust"
	| "fullstack"
	| "java"
	| "python"
	| "c"
	| "compilers"
	| "evm"
	| "anchor"
	| "javascript";

// Combined skill type for candidates
export type SkillTag = JobTag | CandidateTag;

// Candidate-specific tag labels
export const candidateTagLabels: Record<CandidateTag, string> = {
	reth: "Reth",
	alloy: "Alloy",
	"web3-devtools": "Web3 DevTools",
	solidity: "Solidity",
	typescript: "TypeScript",
	rust: "Rust",
	fullstack: "Full Stack",
	java: "Java",
	python: "Python",
	c: "C",
	compilers: "Compilers",
	evm: "EVM",
	anchor: "Anchor",
	javascript: "JavaScript",
};

// Merged tag labels for display
export const tagLabels: Record<SkillTag, string> = {
	...jobTagLabels,
	...candidateTagLabels,
};

export type AvailabilityStatus = "looking" | "open" | "not-looking";
export type VisibilityMode = "public" | "anonymous";
export type ExperienceLevel = "0-1" | "1-3" | "3-5" | "5-10" | "10+";
export type CandidateTier = 1 | 2 | 3 | 4;

// What type of position the candidate is looking for
export type RoleType =
	| "leadership"
	| "management"
	| "engineer"
	| "contractor"
	| "intern"
	| "part-time"
	| "co-founder"
	| "counsel"
	| "advisor"
	| "researcher"
	| "designer"
	| "marketing"
	| "bd"
	| "operations"
	| "investor";

export const roleTypeLabels: Record<RoleType, string> = {
	leadership: "Leadership",
	management: "Management",
	engineer: "Engineer",
	contractor: "Contractor",
	intern: "Intern",
	"part-time": "Part-time",
	"co-founder": "Co-founder",
	counsel: "Counsel",
	advisor: "Advisor",
	researcher: "Researcher",
	designer: "Designer",
	marketing: "Marketing",
	bd: "Business Development",
	operations: "Operations",
	investor: "VC Role",
};

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
	x?: string;
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
	skills: SkillTag[];
	location: string;
	remote: boolean;
	experience: ExperienceLevel;
	availability: AvailabilityStatus;
	preferredRoles: string[];
	lookingFor?: RoleType[];
	achievements?: Achievement[];
	companies?: CompanyReference[];
	socials?: SocialLinks;
	tier: CandidateTier;
	featured: boolean;
	hot?: boolean;
	vouched?: boolean;
	createdAt?: string | Date;
}

export const DCBUILDER_TELEGRAM = "https://t.me/dcbuilder";
