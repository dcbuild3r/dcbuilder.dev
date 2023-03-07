import { VStack, Text } from "@chakra-ui/react";
import Layout from "components/Layout";
import Navbar from "components/Navbar";
import { NextChakraLink } from "components/NextChakraLink";

const ProjectsPage: React.FC = () => {
	return (
		<Layout title="Waifus rule">
			<Navbar />
			<VStack
				spacing={"100px"}
				mt={["200px", "200px", "150px", "150px"]}
				mb="100px"
				textAlign="center"
			>
				<Text w="70vw" fontSize="3xl">
					I'm a research engineer at{" "}
					<NextChakraLink
						href="https://worldcoin.org/"
						textDecoration={"underline"}
					>
						Worldcoin
					</NextChakraLink>
					. I'm able to work on really cool projects that could one
					day improve the lives of millions and potentially billions
					of users. I'm happy to be able to explore all of my
					interests: cryptography (ZK), AI, Rust, Solidity, Ethereum
					and more!
				</Text>
				<Text w="70vw" fontSize="3xl">
					In the past, I worked as a blockchain researcher and
					technical writer at{" "}
					<NextChakraLink
						href="https://moralis.io/"
						textDecoration="underline"
					>
						Moralis
					</NextChakraLink>{" "}
					for two years. Back when I was in high school I worked as a
					front end developer using React, NextJs, Typescript and
					other web technologies. I also have 2 years of experience
					building applications in the AI, ML and data science
					domains. I worked with Python, libraries likes Pandas,
					Numpy, Seaborn, scikit-learn, Tensorflow, Keras, OpenCV and
					many more.{" "}
				</Text>
			</VStack>
		</Layout>
	);
};

export default ProjectsPage;
