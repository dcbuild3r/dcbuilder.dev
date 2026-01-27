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
		id: "morpho-integrations-engineer-apac",
		title: "Integrations Engineer - APAC",
		company: companies.morpho,
		location: "Hong Kong",
		remote: true,
		type: "full-time",
		department: "Engineering",
		link: "https://morpho.org/jobs/integrations-engineer-apac",
	},
	{
		id: "morpho-senior-enterprise-partnerships",
		title: "Senior Enterprise Partnerships",
		company: companies.morpho,
		location: "New York, NY",
		remote: true,
		type: "full-time",
		department: "Business Development",
		link: "https://morpho.org/jobs/senior-enterprise-partnerships",
	},
	{
		id: "morpho-senior-protocol-engineer",
		title: "Senior Protocol Engineer",
		company: companies.morpho,
		location: "Paris, France",
		remote: true,
		type: "full-time",
		department: "Engineering",
		link: "https://morpho.org/jobs/senior-protocol-engineer",
		featured: true,
	},
	{
		id: "morpho-staff-senior-backend-engineer",
		title: "Staff/Senior Backend Engineer",
		company: companies.morpho,
		location: "Paris, France",
		remote: true,
		type: "full-time",
		department: "Engineering",
		link: "https://morpho.org/jobs/staffsenior-backend-engineer",
		featured: true,
	},
	{
		id: "morpho-senior-frontend-engineer",
		title: "Senior Frontend Engineer",
		company: companies.morpho,
		location: "Paris, France",
		remote: true,
		type: "full-time",
		department: "Engineering",
		link: "https://morpho.org/jobs/senior-frontend-engineer-1",
	},
	{
		id: "morpho-staff-fullstack-engineer",
		title: "Staff Fullstack Engineer",
		company: companies.morpho,
		location: "Paris, France",
		remote: true,
		type: "full-time",
		department: "Engineering",
		link: "https://morpho.org/jobs/staff-fullstack-engineer",
		featured: true,
	},
	{
		id: "morpho-defi-business-analyst",
		title: "DeFi Business Analyst",
		company: companies.morpho,
		location: "New York, NY",
		remote: true,
		type: "full-time",
		department: "Business",
		link: "https://morpho.org/jobs/defi-business-analyst",
	},
	{
		id: "morpho-customer-support-specialist",
		title: "Customer Support Specialist",
		company: companies.morpho,
		location: "New York, NY",
		remote: true,
		type: "full-time",
		department: "Support",
		link: "https://morpho.org/jobs/customer-support-specialist",
	},
	{
		id: "morpho-curator-market-specialist",
		title: "Curator / Market Specialist",
		company: companies.morpho,
		location: "Paris, France",
		remote: true,
		type: "full-time",
		department: "Markets",
		link: "https://morpho.org/jobs/curator-market-specialist",
	},
	{
		id: "morpho-risk-analyst",
		title: "Risk Analyst",
		company: companies.morpho,
		location: "New York, NY",
		remote: true,
		type: "full-time",
		department: "Risk",
		link: "https://morpho.org/jobs/risk-analyst",
	},
	{
		id: "morpho-protocol-security-engineer",
		title: "Protocol Security Engineer",
		company: companies.morpho,
		location: "Paris, France",
		remote: true,
		type: "full-time",
		department: "Security",
		link: "https://morpho.org/jobs/protocol-security-engineer",
		featured: true,
	},
	{
		id: "morpho-infrastructure-engineer",
		title: "Infrastructure Engineer",
		company: companies.morpho,
		location: "Paris, France",
		remote: true,
		type: "full-time",
		department: "Engineering",
		link: "https://morpho.org/jobs/job-dnikd63nc7",
	},
	{
		id: "morpho-head-of-people",
		title: "Head of People",
		company: companies.morpho,
		location: "Paris, France",
		remote: false,
		type: "full-time",
		department: "People",
		link: "https://morpho.org/jobs/job-fnaegqvocu",
	},
	{
		id: "morpho-technical-product-marketing-manager",
		title: "Technical Product Marketing Manager",
		company: companies.morpho,
		location: "Paris, France",
		remote: true,
		type: "full-time",
		department: "Marketing",
		link: "https://morpho.org/jobs/job-2xuerfzdn6",
	},
	{
		id: "morpho-general-counsel",
		title: "General Counsel",
		company: companies.morpho,
		location: "New York, NY",
		remote: true,
		type: "full-time",
		department: "Legal",
		link: "https://morpho.org/jobs/job-00x52y1m34",
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
