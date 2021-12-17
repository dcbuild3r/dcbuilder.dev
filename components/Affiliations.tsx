import { AffiliationProps } from "./Affiliation";

const affiliations: AffiliationProps[] = [
	{
		title: "Waifus Anonymous",
		role: "Resident Waifu",
		dateBegin: "Aug 2021",
		dateEnd: "Present",
		description:
			'Waifus Anonymous is collective of your average cryptocurrency enjoyers who (mostly) happen to also be otaku, often choosing cute anime girls ("waifus") as avatars or who often reference anime/manga in their online presence AND may or may not also be (pseudo-) anonymous as well.',
		imageURL: "https://waifusanonymous.com/",

		//      source is name of image + format
		imageSource: "waifusanonymous.png",
		imageWidth: ["200px", "200px", "300px", "300px"],
		bgColor: "white",
	},
	{
		title: "Moralis",
		role: "Blockchain researcher",
		dateBegin: "Jul 2020",
		dateEnd: "Present",
		description:
			"Moralis is a web3 development platform that allows for an easy and simple dapp development experience. I work as a researcher and publish my work in the Ivan on Tech Blockchain review. I research and write about DeFi, DAOs, L2s, MEV, protocols, NFTs, crypto culture and much more. My research is also used internally to improve Moralis products and to help the company thrive in a web3 ecosystem.",
		imageURL: "https://moralis.io/",
		imageSource: "moralis.png",
		imageWidth: ["200px", "200px", "250px", "250px"],
		bgColor: "black",
	},
	{
		title: "Bankless DAO",
		role: "Developer & Researcher",
		dateBegin: "Jun 2021",
		dateEnd: "Present",
		description:
			"I am an active member of the developer and research guilds within the DAO. I'm a Solidity mentor and act as a TA and I also am a multisig signer within the research guild. Bankless is a movement for pioneers seeking liberation from the tyranny of the traditional financial system. Going Bankless means adopting decentralized, permissionless, and censorship-resistant technology. Through these means we will achieve financial self-sovereignty, security, and prosperity.",
		imageURL:
			"https://www.notion.so/bankless/Bankless-DAO-82ba81e7da1c42adb7c4ab67a4f22e8f",
		imageSource: "bdao.png",
		imageWidth: ["200px", "200px", "300px", "300px"],
		bgColor: "white",
	},
];

export default affiliations;
