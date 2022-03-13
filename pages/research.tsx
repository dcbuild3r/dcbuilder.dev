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
				textAlign="center"
			>
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
					I created{" "}
					<NextChakraLink
						textDecoration={"underline"}
						href="https://www.devpill.me/"
					>
						{`devpill.me`}
					</NextChakraLink>
					, which is a public good blockchain development guide aimed
					at becoming the go-to learning resource aggregator for
					building on Ethereum and its wider ecosystem of scaling
					solutions and applications.
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
