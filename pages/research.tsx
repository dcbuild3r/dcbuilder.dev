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
					I'm constantly learning about the things that interest me.
					The best way to keep up with what I'm doing is following me
					on {}
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
