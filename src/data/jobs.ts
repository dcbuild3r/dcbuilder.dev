/**
 * Job type definitions and labels
 * Data is fetched from the database - see src/db/schema/jobs.ts
 */

export type RelationshipCategory = "portfolio" | "network";

export type JobType = "full-time" | "part-time" | "contract" | "internship";

export type JobTag =
	| "hot"
	| "top"
	| "ai"
	| "ml"
	| "mev"
	| "health"
	| "cryptography"
	| "zkp"
	| "protocol"
	| "defi"
	| "infra"
	| "trading"
	| "gaming"
	| "design"
	| "marketing"
	| "bd"
	| "research"
	| "security"
	| "legal"
	| "world"
	| "monad-ecosystem"
	| "berachain-ecosystem"
	| "entry-level"
	| "vc"
	| "accounting"
	| "bci"
	| "hardware"
	| "talent"
	| "leadership"
	| "management"
	| "product"
	| "solana"
	| "internship"
	| "growth"
	| "sales"
	| "account-abstraction"
	| "privacy"
	| "web3"
	| "frontend"
	| "backend"
	| "fullstack"
	| "rust"
	| "mobile"
	| "android"
	| "ios";

export const tagLabels: Record<JobTag, string> = {
	hot: "🔥 HOT",
	top: "⭐ TOP",
	ai: "AI",
	ml: "ML",
	mev: "MEV",
	health: "Health",
	cryptography: "Cryptography",
	zkp: "ZKP",
	protocol: "Protocol",
	defi: "DeFi",
	infra: "Infrastructure",
	trading: "Trading",
	gaming: "Gaming",
	design: "Design",
	marketing: "Marketing",
	bd: "BD",
	research: "Research",
	security: "Security",
	legal: "Legal",
	world: "World",
	"monad-ecosystem": "Monad Ecosystem",
	"berachain-ecosystem": "Berachain Ecosystem",
	"entry-level": "Entry Level",
	vc: "VC",
	accounting: "Accounting",
	bci: "BCI",
	hardware: "Hardware",
	talent: "Talent",
	leadership: "Leadership",
	management: "Management",
	product: "Product",
	solana: "Solana",
	internship: "Internship",
	growth: "Growth",
	sales: "Sales",
	"account-abstraction": "Account Abstraction",
	privacy: "Privacy",
	web3: "Web3",
	frontend: "Frontend",
	backend: "Backend",
	fullstack: "Full Stack",
	rust: "Rust",
	mobile: "Mobile",
	android: "Android",
	ios: "iOS",
};

// Job tiers match portfolio tiers: 1-4 for portfolio companies, 5 for network, 6 for ecosystem
export type JobTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface Company {
	name: string;
	logo?: string;
	website: string;
	category: RelationshipCategory;
	x?: string;
	github?: string;
	careers?: string;
}

export interface Job {
	id: string;
	title: string;
	company: Company;
	location: string;
	remote?: boolean;
	type?: JobType;
	department?: string;
	salary?: string;
	link: string;
	featured?: boolean;
	tags?: JobTag[];
	tier?: JobTier;
	description?: string;
	createdAt?: string | Date;
}
