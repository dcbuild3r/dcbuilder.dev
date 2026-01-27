export interface Affiliation {
  title: string;
  role: string;
  dateBegin: string;
  dateEnd: string;
  description: string;
  imageUrl: string;
  logo: string;
}

export const affiliations: Affiliation[] = [
  {
    title: "World Foundation",
    role: "Research Engineer",
    dateBegin: "Feb 2024",
    dateEnd: "Present",
    description: "Working on the World Foundation Human Collective Grants program (world.org/community-grants), protocol research and development, decentralization of the World ecosystem, and supporting the World mission.",
    imageUrl: "https://world.org/",
    logo: "/images/worldcoin_foundation.png",
  },
  {
    title: "Tools For Humanity",
    role: "Research Engineer",
    dateBegin: "July 2022",
    dateEnd: "Feb 2024",
    description: "Tools for Humanity are the main developers of the World project. As a research engineer on the protocol team at TfH I worked on all the core parts of World ID protocol, the Semaphore merkle tree batcher circuits (SMTB), the signup sequencer, the state bridge contracts and various other parts of the protocol.",
    imageUrl: "https://world.org/",
    logo: "/images/tfh.png",
  },
  {
    title: "Bagel",
    role: "Advisor",
    dateBegin: "Aug 2024",
    dateEnd: "Present",
    description: "Bagel is a machine learning and cryptography research lab building a neutral, peer-to-peer AI ecosystem that covers the complete machine learning lifecycle.",
    imageUrl: "https://bagel.net/",
    logo: "/images/bagel.jpg",
  },
  {
    title: "Modulus Labs",
    role: "Advisor",
    dateBegin: "Oct 2023",
    dateEnd: "Dec 2024",
    description: "Modulus specializes in making artificial intelligence accountable through the use of advanced cryptography including ZK and MPC. Modulus Labs was acquired by Tools For Humanity in December of 2024.",
    imageUrl: "https://world.org/blog/announcements/modulus-labs-joins-tfh-support-applied-research-world",
    logo: "/images/modulus.png",
  },
  {
    title: "devpill.me",
    role: "Creator",
    dateBegin: "Aug 2021",
    dateEnd: "Present",
    description: "I created devpill.me, which is a public good blockchain development guide aimed at becoming the go-to learning resource aggregator for building on Ethereum and its wider ecosystem.",
    imageUrl: "https://www.devpill.me/",
    logo: "/images/devpill.png",
  },
  {
    title: "ETHPrague",
    role: "Coorganizer",
    dateBegin: "Dec 2021",
    dateEnd: "Present",
    description: "ETHPrague is a 3-day organized conference by local members of the Ethereum community that takes place every year.",
    imageUrl: "https://ethprague.com/",
    logo: "/images/ethprague.png",
  },
  {
    title: "Alongside",
    role: "Research Engineer",
    dateBegin: "Mar 2022",
    dateEnd: "July 2022",
    description: "Alongside is a protocol that allows anyone to get crypto market exposure in a few simple clicks. I was a research engineer focusing on decentralized custodians, secure multi-party computation, and governance structures.",
    imageUrl: "https://www.alongside.xyz/",
    logo: "/images/Alongside.png",
  },
  {
    title: "Moralis",
    role: "Blockchain researcher",
    dateBegin: "Jul 2020",
    dateEnd: "Mar 2022",
    description: "Moralis is a web3 development platform that allows for an easy and simple dapp development experience. I worked as a researcher and writer for their weekly research publications.",
    imageUrl: "https://moralis.io/",
    logo: "/images/moralis.png",
  },
];
