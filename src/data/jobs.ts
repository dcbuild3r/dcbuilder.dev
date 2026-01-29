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
	logo: string;
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
	tier?: JobTier; // 1 = highest priority, 2 = medium, 3 = lower
	description?: string;
	createdAt?: string | Date; // For NEW tag display (items < 2 weeks old)
}

// Reusable company definitions
const companies = {
	monad: {
		name: "Monad",
		logo: "/images/investments/monad.jpg",
		website: "https://www.monad.xyz/",
		category: "portfolio" as const,
		x: "https://x.com/monad_xyz",
		github: "https://github.com/monad-developers",
	},
	monadFoundation: {
		name: "Monad Foundation",
		logo: "/images/investments/monad.jpg",
		website: "https://monad.xyz/",
		category: "portfolio" as const,
		x: "https://x.com/monad_xyz",
		github: "https://github.com/monad-developers",
	},
	megaeth: {
		name: "MegaETH",
		logo: "/images/investments/megaeth.jpg",
		website: "https://megaeth.systems/",
		category: "portfolio" as const,
		x: "https://x.com/megaeth",
		github: "https://github.com/megaeth-labs",
	},
	morpho: {
		name: "Morpho",
		logo: "/images/investments/morpho.png",
		website: "https://morpho.org/",
		category: "portfolio" as const,
		x: "https://x.com/morpho",
		github: "https://github.com/morpho-org",
	},
	ritual: {
		name: "Ritual",
		logo: "/images/investments/ritual.png",
		website: "https://ritual.net/",
		category: "portfolio" as const,
		x: "https://x.com/ritualnet",
		github: "https://github.com/ritual-net",
	},
	succinct: {
		name: "Succinct",
		logo: "/images/investments/succinct.png",
		website: "https://succinct.xyz/",
		category: "portfolio" as const,
		x: "https://x.com/SuccinctLabs",
		github: "https://github.com/succinctlabs",
	},
	primeIntellect: {
		name: "Prime Intellect",
		logo: "/images/investments/prime-intellect.jpg",
		website: "https://www.primeintellect.ai/",
		category: "portfolio" as const,
		x: "https://x.com/PrimeIntellect",
		github: "https://github.com/PrimeIntellect-ai",
	},
	perpl: {
		name: "Perpl",
		logo: "/images/investments/perpl.webp",
		website: "https://perpl.xyz/",
		category: "network" as const,
		x: "https://x.com/perpltrade",
	},
	kuru: {
		name: "Kuru",
		logo: "/images/investments/kuru.webp",
		website: "https://www.kuru.io/",
		category: "network" as const,
		x: "https://x.com/kuruexchange",
	},
	rarebetsports: {
		name: "RareBetSports",
		logo: "/images/investments/rarebetsports.webp",
		website: "https://www.rarebetsports.io/",
		category: "network" as const,
		x: "https://x.com/RareBetSports",
	},
	lucis: {
		name: "Lucis",
		logo: "/images/investments/lucis.jpg",
		website: "https://lucis.life/",
		category: "portfolio" as const,
		x: "https://x.com/lucis_life",
	},
	sorella: {
		name: "Sorella",
		logo: "/images/investments/sorella.png",
		website: "https://sorellalabs.xyz/",
		category: "portfolio" as const,
		x: "https://x.com/SorellaLabs",
		github: "https://github.com/sorellalabs",
	},
	flashbots: {
		name: "Flashbots",
		logo: "/images/investments/flashbots.png",
		website: "https://flashbots.net/",
		category: "network" as const,
		github: "https://github.com/flashbots",
	},
	ethereumFoundation: {
		name: "Ethereum Foundation",
		logo: "/images/investments/ethereum.png",
		website: "https://ethereum.foundation/",
		category: "network" as const,
		x: "https://x.com/ethereumfndn/",
		github: "https://github.com/ethereum",
	},
	aztec: {
		name: "Aztec",
		logo: "/images/investments/aztec.png",
		website: "https://aztec.network/",
		category: "network" as const,
		x: "https://x.com/aztecnetwork",
		github: "https://github.com/aztecprotocol/",
	},
	world: {
		name: "World",
		logo: "/images/investments/world.png",
		website: "https://world.org/",
		category: "network" as const,
		x: "https://x.com/worldcoin",
		github: "https://github.com/worldcoin",
	},
	agora: {
		name: "Agora",
		logo: "/images/investments/agora.jpg",
		website: "https://www.agora.xyz/",
		category: "portfolio" as const,
		x: "https://x.com/AgoraGovernance",
		github: "https://github.com/voteagora",
	},
	rhinestone: {
		name: "Rhinestone",
		logo: "/images/investments/rhinestone.jpg",
		website: "https://www.rhinestone.wtf/",
		category: "portfolio" as const,
		x: "https://x.com/rhinestonewtf",
		github: "https://github.com/rhinestonewtf",
	},
	berachain: {
		name: "Berachain",
		logo: "/images/investments/berachain.png",
		website: "https://www.berachain.com/",
		category: "portfolio" as const,
		x: "https://x.com/berachain",
		github: "https://github.com/berachain",
	},
	// Berachain Ecosystem Companies
	infraredFinance: {
		name: "Infrared Finance",
		logo: "/images/investments/infrared.png",
		website: "https://www.infrared.finance/",
		category: "network" as const,
		x: "https://x.com/infraredfinance",
		github: "https://github.com/infrared-dao",
	},
	oogaBooga: {
		name: "Ooga Booga",
		logo: "/images/investments/ooga-booga.png",
		website: "https://oogabooga.io/",
		category: "network" as const,
		x: "https://x.com/0xoogabooga",
		github: "https://github.com/0xoogabooga",
	},
	beraBuzz: {
		name: "bera.buzz",
		logo: "/images/investments/berachain.png",
		website: "https://bera.buzz/",
		category: "network" as const,
	},
	kodiakFinance: {
		name: "Kodiak Finance",
		logo: "/images/investments/kodiak.jpg",
		website: "https://kodiak.finance/",
		category: "network" as const,
		x: "https://x.com/KodiakFi",
		github: "https://github.com/kodiak-finance",
	},
	goldsky: {
		name: "Goldsky",
		logo: "/images/investments/goldsky.jpg",
		website: "https://goldsky.com/",
		category: "network" as const,
		x: "https://x.com/goldskyio/",
		github: "https://github.com/goldsky-io",
	},
	inco: {
		name: "Inco",
		logo: "/images/investments/inco.png",
		website: "https://www.inco.org/",
		category: "portfolio" as const,
		x: "https://x.com/inconetwork",
		github: "https://github.com/Inco-fhevm",
	},
	taceo: {
		name: "TACEO",
		logo: "/images/investments/taceo.png",
		website: "https://www.taceo.io/",
		category: "network" as const,
		x: "https://x.com/TACEO_IO",
		github: "https://github.com/taceolabs/",
	},
	nethermind: {
		name: "Nethermind",
		logo: "/images/investments/nethermind.png",
		website: "https://www.nethermind.io/",
		category: "network" as const,
		x: "https://x.com/nethermindeth/",
		github: "https://github.com/NethermindEth",
	},
	nascent: {
		name: "Nascent",
		logo: "/images/investments/nascent.svg",
		website: "https://www.nascent.xyz/",
		category: "network" as const,
		x: "https://x.com/nascent",
		github: "https://github.com/nascentxyz",
	},
	coinfund: {
		name: "CoinFund",
		logo: "/images/investments/coinfund.jpg",
		website: "https://www.coinfund.io/",
		category: "network" as const,
		x: "https://x.com/coinfund_io",
	},
	blockchainCapital: {
		name: "Blockchain Capital",
		logo: "/images/investments/blockchain-capital.jpg",
		website: "https://blockchaincapital.com/",
		category: "network" as const,
		x: "https://x.com/blockchaincap",
		github: "https://github.com/BlockchainCap",
	},
	rockawayx: {
		name: "RockawayX",
		logo: "/images/investments/rockawayx.jpg",
		website: "https://rockawayx.com/",
		category: "network" as const,
		x: "https://x.com/Rockaway_X",
	},
	ackee: {
		name: "Ackee Blockchain",
		logo: "/images/investments/ackee.jpg",
		website: "https://ackeeblockchain.com/",
		category: "network" as const,
		x: "https://x.com/ackeeblockchain",
		github: "https://github.com/Ackee-Blockchain",
	},
	reilabs: {
		name: "Reilabs",
		logo: "/images/investments/reilabs.jpg",
		website: "https://reilabs.io/",
		category: "network" as const,
		x: "https://x.com/reilabs_io/",
		github: "https://github.com/reilabs",
	},
	bagel: {
		name: "Bagel",
		logo: "/images/investments/bagel.jpg",
		website: "https://bagel.net/",
		category: "portfolio" as const,
		x: "https://x.com/bagel_network",
		github: "https://github.com/bageldotcom",
	},
	letsgoDevops: {
		name: "Let's Go DevOps",
		logo: "/images/investments/letsgo.png",
		website: "https://apply.canvider.com/",
		category: "network" as const,
	},
	wonderland: {
		name: "Wonderland",
		logo: "/images/investments/wonderland.png",
		website: "https://defi.sucks/",
		category: "network" as const,
		x: "https://x.com/Wonderland",
		github: "https://github.com/defi-wonderland",
	},
	merge: {
		name: "Merge",
		logo: "/images/investments/merge.jpg",
		website: "https://merge.io/",
		category: "network" as const,
		x: "https://x.com/merge",
	},
	uniswap: {
		name: "Uniswap Labs",
		logo: "/images/investments/uniswap.jpg",
		website: "https://uniswap.org/",
		category: "network" as const,
		x: "https://x.com/Uniswap",
		github: "https://github.com/Uniswap",
	},
	categoryLabs: {
		name: "Category Labs",
		logo: "/images/investments/category.jpg",
		website: "https://www.category.xyz/",
		category: "portfolio" as const,
		x: "https://x.com/category_xyz",
		github: "https://github.com/category-labs",
	},
	alchemy: {
		name: "Alchemy",
		logo: "/images/investments/alchemy.jpg",
		website: "https://www.alchemy.com/",
		category: "network" as const,
		x: "https://x.com/Alchemy",
		github: "https://github.com/alchemyplatform",
	},
	dune: {
		name: "Dune",
		logo: "/images/investments/dune.jpg",
		website: "https://dune.com/",
		category: "network" as const,
		x: "https://x.com/Dune",
		github: "https://github.com/duneanalytics",
	},
	variant: {
		name: "Variant",
		logo: "/images/investments/variant.jpg",
		website: "https://variant.fund/",
		category: "network" as const,
		x: "https://x.com/variantfund",
	},
	electricCapital: {
		name: "Electric Capital",
		logo: "/images/investments/electric-capital.png",
		website: "https://www.electriccapital.com/",
		category: "network" as const,
		x: "https://x.com/electriccapital",
	},
	tempo: {
		name: "Tempo",
		logo: "/images/companies/tempo.jpg",
		website: "https://tempo.xyz/",
		category: "network" as const,
		x: "https://x.com/tempo",
	},
};


// Static job data removed - using database instead
export const jobs: Job[] = [];
