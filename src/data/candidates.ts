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
	lookingFor?: RoleType[]; // Types of positions the candidate is looking for
	achievements?: Achievement[];
	companies?: CompanyReference[];
	socials?: SocialLinks;
	tier: CandidateTier;
	featured: boolean;
	hot?: boolean;
	vouched?: boolean; // true = personally known/vouched, false/undefined = not personally known
	createdAt?: string | Date;
}

export const DCBUILDER_TELEGRAM = "https://t.me/dcbuilder";

export const candidates: Candidate[] = [
	{
		id: "norswap",
		visibility: "public",
		name: "Nicolas \"Norswap\" Laurent",
		title: "Tech Lead / Protocol Engineer",
		bio: "Experienced crypto tech leader with strong track record in protocol design at Optimism and leading teams to ship at Happy Devs. Open to tech leadership, VC investment roles, or co-founding opportunities.",
		profileImage: "/images/candidates/norswap.jpg",
		skills: ["top", "protocol", "infra", "vc", "research", "compilers", "java", "typescript", "python", "c"],
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
		lookingFor: ["leadership", "management", "investor", "co-founder"],
		companies: [
			{ name: "Optimism", url: "https://optimism.io" },
			{ name: "Happy Devs", url: "https://docs.happy.tech/" },
		],
		socials: {
			x: "https://x.com/norswap",
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
	},
	{
		id: "viraz",
		visibility: "public",
		name: "Viraz Malhotra",
		title: "Senior Smart Contract & Backend Engineer",
		bio: "EVM developer with 6 years of experience building smart contracts and backend applications for DeFi and Infrastructure projects (L1s, L2s). Also experienced as a security researcher in both EVM and Solana domains.",
		profileImage: "/images/candidates/viraz.jpg",
		skills: ["defi", "infra", "security", "solana", "protocol", "solidity", "evm", "anchor", "typescript", "javascript", "rust"],
		location: "Remote",
		remote: true,
		experience: "5-10",
		availability: "looking",
		preferredRoles: [
			"Senior Smart Contract Engineer",
			"Senior Backend Engineer",
			"Security Researcher",
		],
		lookingFor: ["engineer", "researcher"],
		companies: [
			{ name: "Camp Network", url: "https://campnetwork.xyz" },
			{ name: "Fuel Labs", url: "https://fuel.network" },
			{ name: "Shell Protocol", url: "https://shellprotocol.io" },
			{ name: "Halofi", url: "https://halofi.me" },
			{ name: "Frontier", url: "https://frontier.xyz" },
			{ name: "InstaDApp", url: "https://instadapp.io" },
		],
		socials: {
			x: "https://x.com/Viraz04",
			github: "https://github.com/viraj124",
			linkedin: "https://www.linkedin.com/in/viraz-malhotra-8a1639118/",
			telegram: "https://t.me/Viraz04",
			email: "virajm72@gmail.com",
			cv: "https://docs.google.com/document/d/1AHbTRPSTJ1K7PVqQiRq74Dr7FLI1AvZtiOdnuJtRhaQ/edit?tab=t.0#heading=h.41ung0p45egs",
		},
		tier: 3,
		featured: false,
		vouched: true,
	},
	{
		id: "temitayo",
		visibility: "public",
		name: "Temitayo Daniel",
		title: "Mid-Level Solidity Engineer",
		bio: "Solidity engineer with hands-on experience in production EVM smart contracts, diamond patterns (EIP-2535), upgradeable systems, and on-chain tooling. Contributed to Aavegotchi's smart contract infrastructure.",
		profileImage: "/images/candidates/temitayo.jpg",
		skills: ["defi", "protocol", "infra", "solidity"],
		location: "Remote",
		remote: true,
		experience: "3-5",
		availability: "looking",
		preferredRoles: [
			"Solidity Engineer",
			"Smart Contract Developer",
		],
		lookingFor: ["engineer"],
		companies: [
			{ name: "Pixelcraft Studios", url: "https://pixelcraft.studio" },
			{ name: "Web3Bridge", url: "https://web3bridge.com" },
		],
		socials: {
			x: "https://x.com/timidan_x",
			github: "https://github.com/timidan",
			linkedin: "https://linkedin.com/in/temitayo-daniel",
			email: "timidanx@gmail.com",
			website: "https://www.timidan.xyz/portfolio",
			cv: "/resumes/temitayo-daniel-resume.pdf",
		},
		tier: 4,
		featured: false,
	},
	{
		id: "kevin-castro",
		visibility: "public",
		name: "Kevin Castro",
		title: "Product Marketing Manager",
		bio: "Product marketing professional with experience at OpenZeppelin. Bilingual (English/Spanish) with international experience across multiple markets.",
		profileImage: "/images/candidates/kevin-castro.jpg",
		skills: ["marketing", "product", "bd", "growth", "sales"],
		location: "Miami, FL",
		remote: true,
		experience: "5-10",
		availability: "looking",
		preferredRoles: [
			"Product Marketing Manager",
			"Marketing Manager",
		],
		lookingFor: ["marketing", "management"],
		companies: [
			{ name: "OpenZeppelin", url: "https://openzeppelin.com" },
			{ name: "Firewall", url: "https://usefirewall.com" },
			{ name: "Code4rena", url: "https://code4rena.com" },
			{ name: "Immutable", url: "https://immutable.com" },
			{ name: "CertiK", url: "https://certik.com" },
		],
		socials: {
			x: "https://x.com/_etherean",
			linkedin: "https://www.linkedin.com/in/kevincas/",
			email: "kevincastroperez@gmail.com",
			cv: "https://drive.google.com/file/d/1qjhym7ioWlsDOcdu87szt6GXBBFxm7Jq/view",
		},
		tier: 3,
		featured: false,
		vouched: true,
	},
	{
		id: "atris",
		visibility: "public",
		name: "Josef Vacek (atris)",
		title: "Senior Full Stack Software Engineer",
		bio: "AI startup founder and senior software engineer. Built his first website at age 9, programming professionally since 12. Reth contributor. Previously at Penumbra Labs focused on financial privacy, led system rewrites at Moralis, built critical tools deployed by AWS and US DHS at 3PillarGlobal. Angel investor in AI and web3 (Monad, Succinct, Praxis). TypeScript, Rust, and Solidity developer.",
		profileImage: "/images/candidates/atris.jpg",
		skills: ["top", "protocol", "infra", "defi", "ai", "web3-devtools", "reth", "alloy", "solidity", "typescript", "rust", "fullstack"],
		location: "Czech Republic",
		remote: true,
		experience: "5-10",
		availability: "looking",
		preferredRoles: [
			"Senior Full Stack Software Engineer",
			"Senior Software Engineer",
		],
		lookingFor: ["engineer"],
		companies: [
			{ name: "AI Startup Founder" },
			{ name: "Reth Contributor", url: "https://github.com/paradigmxyz/reth" },
			{ name: "Penumbra Labs", url: "https://penumbra.zone" },
			{ name: "Moralis", url: "https://moralis.io" },
			{ name: "3PillarGlobal", url: "https://www.3pillarglobal.com" },
			{ name: "Abradatas", url: "https://abradatas.cz/" },
		],
		socials: {
			x: "https://x.com/atris_eth",
			github: "https://github.com/vacekj",
			linkedin: "https://www.linkedin.com/in/josef-v-19021b128/",
			telegram: "https://t.me/vacekj",
			email: "atriscrypto@protonmail.com",
			website: "https://atris.cc/",
			cv: "https://docs.google.com/document/d/18l4skXiywdVEOvRzFMZe5J7inykgmMaq8EvGD-xYHec/edit?tab=t.0",
		},
		tier: 3,
		featured: true,
		hot: true,
	},
	{
		id: "will-schwab",
		visibility: "public",
		name: "Will Schwab",
		title: "Smart Contract Engineering & Management",
		bio: "In the Ethereum ecosystem since 2017 with extensive experience in smart contract development and engineering management. Prefers management roles but open to dev. Original member of Ethereum Cat Herders, multisig signer, and active community contributor with 2.5k+ rep on Ethereum StackExchange.",
		profileImage: "/images/candidates/will-schwab.jpg",
		skills: ["top", "defi", "protocol", "solidity", "evm", "javascript", "typescript"],
		location: "Remote",
		remote: true,
		experience: "5-10",
		availability: "looking",
		preferredRoles: [
			"Engineering Manager",
			"Smart Contract Team Lead",
			"Senior Smart Contract Engineer",
		],
		lookingFor: ["management", "leadership", "engineer", "part-time"],
		companies: [
			{ name: "ViFi", url: "https://www.virtualfinance.xyz" },
			{ name: "Alchemix", url: "https://alchemix.fi" },
			{ name: "Polygon Labs", url: "https://polygon.technology" },
			{ name: "Linum Labs", url: "https://linumlabs.com" },
			{ name: "Ethereum Cat Herders", url: "https://ethereumcatherders.com" },
		],
		socials: {
			x: "https://x.com/wschwab_",
			github: "https://github.com/wschwab",
			telegram: "https://t.me/wschwab",
			linkedin: "https://www.linkedin.com/in/william-schwab4",
			email: "w.s.schwab4@gmail.com",
			cv: "/resumes/will-schwab-cv.pdf",
		},
		tier: 2,
		featured: true,
		hot: true,
	},
	{
		id: "emmanuel-christopher",
		visibility: "public",
		name: "Emmanuel Christopher",
		title: "Web3 DevOps & Data Engineer",
		bio: "Blockchain data infrastructure engineer with experience across node management, data pipelines, and DevOps. Operated 15+ blockchain nodes in production, cut RPC p90 latency from ~2s to <250ms, and reduced AWS spend by 45%. Built Krainode, an open-source JSON-RPC playground.",
		profileImage: "/images/candidates/emmanuel-christopher.jpg",
		skills: ["infra", "web3-devtools", "python", "rust", "typescript"],
		location: "Remote (UTC+1)",
		remote: true,
		experience: "1-3",
		availability: "looking",
		preferredRoles: [
			"Data Engineer",
			"DevOps Engineer",
			"SRE",
			"Infrastructure Engineer",
		],
		lookingFor: ["engineer"],
		companies: [
			{ name: "Krainode", url: "https://krainode.krissemmy.com" },
			{ name: "GlueX Protocol", url: "https://gluex.xyz" },
			{ name: "Evermight" },
			{ name: "Chain Co-Op" },
		],
		socials: {
			x: "https://x.com/chris__emma",
			github: "https://github.com/krissemmy",
			telegram: "https://t.me/chris_emmanuel17",
			linkedin: "https://linkedin.com/in/emmanuel-christopher",
			email: "krissemmy17@gmail.com",
			website: "https://krissemmy.com",
			cv: "/resumes/emmanuel-christopher-resume.pdf",
		},
		tier: 4,
		featured: false,
	},
	{
		id: "prathmesh",
		visibility: "public",
		name: "Prathmesh Khandelwal",
		title: "Blockchain Infrastructure Engineer",
		bio: "4+ years building core Web3 systems across cross-chain settlement, chain abstraction, and developer tooling. Currently at Everclear leading solver and clearing-layer architecture. Contributed to EIP-7281 (xERC20), supporting $1B+ in liquidity migrations. Co-built a V(3,3) DEX that became largest by TVL on Plasma.",
		profileImage: "/images/candidates/prathmesh.jpg",
		skills: ["protocol", "infra", "defi", "web3-devtools", "solidity", "rust", "typescript", "javascript", "anchor"],
		location: "Remote",
		remote: true,
		experience: "3-5",
		availability: "open",
		preferredRoles: [
			"Backend Engineer",
			"Protocol Engineer",
			"Infrastructure Engineer",
		],
		lookingFor: ["engineer"],
		companies: [
			{ name: "Everclear", url: "https://everclear.org" },
			{ name: "Push Protocol", url: "https://push.org" },
			{ name: "Lithos DEX" },
		],
		socials: {
			x: "https://x.com/0xprathmesh",
			github: "https://github.com/prathmeshkhandelwal1",
			linkedin: "https://www.linkedin.com/in/prathmesh-khandelwal-337b651a2",
			email: "prathmeshkhandelwal83@gmail.com",
			cv: "/resumes/prathmesh-khandelwal-resume.pdf",
		},
		tier: 3,
		featured: false,
	},
	{
		id: "kiasaki",
		visibility: "public",
		name: "Kiasaki",
		title: "Senior Protocol/Full-stack Engineer",
		bio: "Senior protocol and full-stack engineer with 15 years of experience. Expertise in Solidity, Solana, DeFi protocols, WASM, Go, Rust, JavaScript, and React. Based in Canada, available for remote work.",
		profileImage: "/images/candidates/kiasaki.jpg",
		skills: ["protocol", "defi", "solana", "solidity", "rust", "javascript", "fullstack"],
		location: "Canada",
		remote: true,
		experience: "10+",
		availability: "looking",
		preferredRoles: [
			"Senior Protocol Engineer",
			"Full-stack Engineer",
			"Smart Contract Engineer",
		],
		lookingFor: ["engineer"],
		socials: {
			x: "https://x.com/kiasaki0",
			github: "https://github.com/kiasaki",
			telegram: "https://t.me/kiasaki",
			email: "kiasaki0000@gmail.com",
			cv: "https://www.kiasaki.com/cv.pdf",
		},
		tier: 2,
		featured: true,
	},
	{
		id: "burden0x",
		visibility: "public",
		name: "burden0x",
		title: "Full-stack Web Developer",
		bio: "Full-stack web developer with over 7 years of experience building modern web applications, specializing in front end development with React.js, Next.js, and blockchain technologies. Proven track record of optimizing application performance, delivering user-facing features, and working across the full development stack from server infrastructure to UI/UX implementation.",
		profileImage: "/images/candidates/burden0x.jpg",
		skills: ["defi", "fullstack", "typescript", "javascript"],
		location: "Remote",
		remote: true,
		experience: "5-10",
		availability: "looking",
		preferredRoles: [
			"Full-stack Developer",
			"Frontend Engineer",
			"Web Developer",
		],
		lookingFor: ["engineer", "contractor"],
		companies: [
			{ name: "SudoSwap", url: "https://sudoswap.xyz" },
			{ name: "Zora", url: "https://zora.co" },
			{ name: "Umami Finance", url: "https://umami.finance" },
			{ name: "Marigold Labs" },
		],
		socials: {
			telegram: "https://t.me/burden0x",
			website: "https://burden.dev",
		},
		tier: 3,
		featured: false,
	},
];
