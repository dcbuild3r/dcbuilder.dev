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
		id: "alex-chen",
		visibility: "public",
		name: "Alex Chen",
		title: "Senior Smart Contract Engineer",
		bio: "Former Uniswap engineer with 5+ years in DeFi. Specialized in gas optimization, security auditing, and protocol design. Led development of multiple TVL >$100M protocols.",
		profileImage: "/images/candidates/anonymous-placeholder.svg",
		skills: ["defi", "security", "protocol", "research"],
		location: "San Francisco, CA",
		remote: true,
		experience: "5-10",
		availability: "open",
		preferredRoles: ["Lead Engineer", "Protocol Architect", "Security Lead"],
		companies: [
			{ name: "Uniswap Labs", url: "https://uniswap.org" },
			{ name: "OpenZeppelin", url: "https://openzeppelin.com" },
		],
		socials: {
			twitter: "https://x.com/example",
			github: "https://github.com/example",
			email: "alex@example.com",
		},
		tier: 1,
		featured: true,
		hot: true,
		dateAdded: "2025-01-15",
	},
	{
		id: "maya-protocol",
		visibility: "anonymous",
		name: "Maya Rodriguez",
		anonymousAlias: "CryptoMaya",
		title: "Full Stack Blockchain Developer",
		bio: "Building in crypto since 2019. Strong background in TypeScript, Rust, and Solidity. Looking for innovative teams working on infrastructure or DeFi.",
		skills: ["infra", "defi", "protocol"],
		location: "Europe",
		remote: true,
		experience: "3-5",
		availability: "looking",
		preferredRoles: ["Senior Engineer", "Tech Lead"],
		tier: 2,
		featured: true,
		dateAdded: "2025-01-10",
	},
	{
		id: "james-web3",
		visibility: "public",
		name: "James Park",
		title: "AI/ML Engineer",
		bio: "Machine learning engineer exploring the intersection of AI and crypto. Experience with LLMs, distributed training, and on-chain ML inference.",
		profileImage: "/images/candidates/anonymous-placeholder.svg",
		skills: ["ai", "research", "infra"],
		location: "Seoul, Korea",
		remote: true,
		experience: "3-5",
		availability: "open",
		preferredRoles: ["ML Engineer", "Research Engineer"],
		socials: {
			twitter: "https://x.com/example2",
			github: "https://github.com/example2",
			linkedin: "https://linkedin.com/in/example2",
		},
		tier: 2,
		featured: false,
		vouched: false, // Referred candidate, not personally known
		dateAdded: "2025-01-08",
	},
	{
		id: "anon-trader",
		visibility: "anonymous",
		name: "Sarah Thompson",
		anonymousAlias: "QuantAnon",
		title: "Quantitative Researcher",
		bio: "PhD in Applied Mathematics. 3 years at top-tier trading firm. Interested in MEV research, market microstructure, and DeFi trading strategies.",
		skills: ["trading", "mev", "research", "defi"],
		location: "Remote",
		remote: true,
		experience: "5-10",
		availability: "looking",
		preferredRoles: ["Quant Researcher", "Trading Strategist"],
		tier: 1,
		featured: true,
		hot: true,
		dateAdded: "2025-01-20",
	},
];
