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
					. I am currently building a{" "}
					<NextChakraLink
						href="https://github.com/worldcoin/proto-neural-zkp"
						textDecoration="underline"
					>
						zero-knowledge circuit for a neural network
					</NextChakraLink>{" "}
					with{" "}
					<NextChakraLink
						href="https://github.com/mir-protocol/plonky2"
						textDecoration={"underline"}
					>
						plonky2
					</NextChakraLink>{" "}
					and Rust so Worldcoin users can self-host their biometric
					data and generate their IrisHash permissionlessly. I'm also
					passionate about education where I'm working on creating a
					blockchain development guide -{" "}
					<NextChakraLink
						href={"https://devpill.me/"}
						textDecoration="underline"
					>
						devpill.me
					</NextChakraLink>{" "}
					- as a public good. I'm also an advisor to two blockchain
					development bootcamps:{" "}
					<NextChakraLink
						href="https://www.artemis.education/"
						textDecoration={"underline"}
					>
						Artemis
					</NextChakraLink>{" "}
					and{" "}
					<NextChakraLink
						href={"https://crystalize.dev/"}
						textDecoration={"underline"}
					>
						Crystalize
					</NextChakraLink>
					. I strongly believe that great and freely available
					education in all areas of learning is essential for humanity
					to thrive.
				</Text>
				<Text w="70vw" fontSize="3xl">
					At Worldcoin I'm able to work on very impactful work that
					could one day improve the lives of millions and potentially
					billions of users. After almost a year of exploring the
					blockchain development landscape I found a role that allows
					me to work on all of my interests: Cryptography and
					mathematics more broadly, infrastructure, open-source
					software, AI, Rust, Solidity, Ethereum and more!
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
