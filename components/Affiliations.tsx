import { AffiliationProps } from "./Affiliation";

const affiliations: AffiliationProps[] = [
	{
		title: "Alongside Finance",
		role: "Full-stack blockchain dev, Research engineer",
		dateBegin: "Mar 2022",
		dateEnd: "Present",
		description:
			"I'm a full-stack blockchain developer and research engineer. I build web3 enabled parts of the core application from front end to back end to smart contracts, help design the systems that govern the market indexes, do research design and implement solutions to problems.",
		imageURL: "https://www.alongside.finance/",

		//      source is name of image + format
		imageSource: "Alongside.png",
		imageWidth: ["200px", "200px", "300px", "300px"],
		bgColor: "white",
	},
	{
		title: "Tribe DAO",
		role: "Smart contract development (DAO guest)",
		dateBegin: "Mar 2021",
		dateEnd: "Present",
		description:
			"At Tribe DAO I'm currently building a leverage looper for Rari Capital's Fuse money market. I'm a guest smart contract developer, meaning that I write Solidity on a very part time basis within the DAO.",
		imageURL: "https://fei.money/",

		//      source is name of image + format
		imageSource: "tribe.png",
		imageWidth: ["200px", "200px", "270px", "270px"],
		bgColor: "black",
	},
	{
		title: "devpill.me",
		role: "Founder, core contributor",
		dateBegin: "Aug 2021",
		dateEnd: "Present",
		description:
			"I created devpill.me, which is a public good blockchain development guide aimed at becoming the go-to learning resource aggregator for building on Ethereum and its wider ecosystem of scaling solutions and applications. ",
		imageURL: "https://www.devpill.me/",

		//      source is name of image + format
		imageSource: "devpill.png",
		imageWidth: ["200px", "200px", "300px", "300px"],
		bgColor: "white",
	},
	{
		title: "Moralis",
		role: "Blockchain researcher",
		dateBegin: "Jul 2020",
		dateEnd: "Mar 2022",
		description:
			"Moralis is a web3 development platform that allows for an easy and simple dapp development experience. I worked as a researcher and published my work in the Ivan on Tech Blockchain review. I still occassionally research and write about DeFi, DAOs, L2s, MEV, protocols, ZK tech, etc. My research was also used internally to improve Moralis products and to help the company thrive in a web3 ecosystem.",
		imageURL: "https://moralis.io/",
		imageSource: "moralis.png",
		imageWidth: ["200px", "200px", "250px", "250px"],
		bgColor: "black",
	},
];

export default affiliations;
