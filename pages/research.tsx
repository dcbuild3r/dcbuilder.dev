import { VStack, Text } from "@chakra-ui/react";
import Layout from "components/Layout";
import Navbar from "components/Navbar";
import { NextChakraLink } from "components/NextChakraLink";
import React from "react";

const ResearchPage: React.FC = () => {
	return (
		<Layout title="Waifus rule">
			<Navbar />
			<VStack
				spacing="100px"
				mb="100px"
				mt={["200px", "200px", "150px", "150px"]}
			>
				<Text w="70vw" fontSize="3xl">
					As a researcher for Moralis I like to have a generic
					understanding of everything that is happening in crypto and
					web3 at large. The topics that interest me the most are
					DeFi, DAOs, Ethereum core and L2 scaling, MEV and
					NFT/metaverse.
				</Text>
				<Text w="70vw" fontSize="3xl">
					I publish some of the research I write on my {}
					<NextChakraLink
						textDecoration={"underline"}
						href="https://mirror.xyz/dcbuilder.eth"
					>
						{`Mirror`}
					</NextChakraLink>
					{` `}
					page. My first article published on Mirror is {}
					<NextChakraLink
						textDecoration={"underline"}
						href="https://mirror.xyz/dcbuilder.eth/QX_ELJBQBm1Iq45ktPsz8pWLZN1C52DmEtH09boZuo0"
					>
						The Ultimate Guide to L2s on Ethereum
					</NextChakraLink>
					, it lays down a comprehensive overview of what Ethereum's
					rollup centric roadmap looks like and what are some of the
					most popular L2 scaling solutions on the market and which
					ones are yet do be deployed.
				</Text>
				<Text w="70vw" fontSize="3xl">
					I'm constantly reading new material and deepening my
					knowledge in all of my fields of interest. The best way to
					keep up with what I'm doing is following me on {}
					<NextChakraLink
						textDecoration={"underline"}
						href="https://twitter.com/DCbuild3r"
					>
						Twitter
					</NextChakraLink>{" "}
					where I usually retweet what I'm looking into at any given
					point in time.
				</Text>
			</VStack>
		</Layout>
	);
};

export default ResearchPage;
