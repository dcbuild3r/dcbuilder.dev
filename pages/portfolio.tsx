import { VStack, Text } from "@chakra-ui/react";
import Layout from "components/Layout";
import Navbar from "components/Navbar";
import { NextChakraLink } from "components/NextChakraLink";
import React from "react";

const ResearchPage: React.FC = () => {
	return (
		<Layout title="dcbuilder.dev - Portfolio">
			<Navbar />
			<VStack
				spacing="100px"
				mb="100px"
				mt={["200px", "200px", "150px", "150px"]}
				textAlign="center"
			>
				<Text w="70vw" fontSize="3xl">
					Stay tuned for updates on the projects I have invested in. I
					am waiting to publish an article about this on{" "}
					<NextChakraLink
						textDecoration={"underline"}
						href="https://dcbuilder.mirror.xyz/"
					>
						{"Mirror"}
					</NextChakraLink>{" "}
					shortly after ETHDenver 2024.
				</Text>
			</VStack>
		</Layout>
	);
};

export default ResearchPage;
