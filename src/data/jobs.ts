export type RelationshipCategory = "portfolio" | "network";

export type JobType = "full-time" | "part-time" | "contract" | "internship";

export interface Company {
	name: string;
	logo: string;
	website: string;
	category: RelationshipCategory;
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
}

// Reusable company definitions
const companies = {
	monad: {
		name: "Monad",
		logo: "/images/investments/monad.jpg",
		website: "https://www.monad.xyz/",
		category: "portfolio" as const,
	},
	megaeth: {
		name: "MegaETH",
		logo: "/images/investments/megaeth.jpg",
		website: "https://megaeth.systems/",
		category: "portfolio" as const,
	},
	morpho: {
		name: "Morpho",
		logo: "/images/investments/morpho.png",
		website: "https://morpho.org/",
		category: "portfolio" as const,
	},
	ritual: {
		name: "Ritual",
		logo: "/images/investments/ritual.png",
		website: "https://ritual.net/",
		category: "portfolio" as const,
	},
	succinct: {
		name: "Succinct",
		logo: "/images/investments/succinct.png",
		website: "https://succinct.xyz/",
		category: "portfolio" as const,
	},
	primeIntellect: {
		name: "Prime Intellect",
		logo: "/images/investments/prime-intellect.jpg",
		website: "https://www.primeintellect.ai/",
		category: "portfolio" as const,
	},
};

export const jobs: Job[] = [
	{
		id: "monad-rust-engineer",
		title: "Senior Rust Engineer",
		company: companies.monad,
		location: "New York, NY",
		remote: true,
		type: "full-time",
		department: "Engineering",
		link: "https://www.monad.xyz/careers",
		featured: true,
	},
	{
		id: "megaeth-protocol-engineer",
		title: "Protocol Engineer",
		company: companies.megaeth,
		location: "Remote",
		remote: true,
		type: "full-time",
		department: "Engineering",
		link: "https://jobs.ashbyhq.com/megaeth",
		featured: true,
	},
	{
		id: "morpho-smart-contract-engineer",
		title: "Smart Contract Engineer",
		company: companies.morpho,
		location: "Paris / Remote",
		remote: true,
		type: "full-time",
		department: "Engineering",
		link: "https://jobs.lever.co/morpho",
		featured: true,
	},
	{
		id: "ritual-ml-engineer",
		title: "ML Infrastructure Engineer",
		company: companies.ritual,
		location: "Remote",
		remote: true,
		type: "full-time",
		department: "Engineering",
		link: "https://ritual.net/careers",
		featured: true,
	},
	{
		id: "succinct-zk-engineer",
		title: "ZK Engineer",
		company: companies.succinct,
		location: "San Francisco / Remote",
		remote: true,
		type: "full-time",
		department: "Engineering",
		link: "https://succinct.xyz/careers",
		featured: true,
	},
	{
		id: "prime-intellect-research",
		title: "Research Engineer",
		company: companies.primeIntellect,
		location: "Remote",
		remote: true,
		type: "full-time",
		department: "Research",
		link: "https://www.primeintellect.ai/careers",
		featured: true,
	},
];
