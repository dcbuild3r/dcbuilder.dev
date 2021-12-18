import { VStack, Text } from "@chakra-ui/react";
import Layout from "components/Layout";
import Navbar from "components/Navbar";
import { NextChakraLink } from "components/NextChakraLink";

const ProjectsPage: React.FC = () => {
	return (
		<Layout title="Waifus rule">
			<Navbar />
			<VStack spacing={"100px"} mt={["200px", "200px", "150px", "150px"]}>
				<Text w="70vw" fontSize="3xl">
					I've been working as a blockchain researcher for about two
					years. In the past I worked as a front end developer and I
					also have 2 years of experience building applications in the
					AI, ML and data science domains. I worked with Python,
					libraries likes Pandas, Numpy, Seaborn, scikit-learn,
					Tensorflow, Keras, OpenCV and many more. I also coded up
					websites using React, NextJs, Typescript and other web
					technologies.
				</Text>

				<Text w="70vw" fontSize="3xl">
					I am currently transitioning to a full-stack blockchain
					developer role, which means that I'm constantly improving my
					skills in Solidity, Hardhat, ethers, dapptools, Foundry,
					Rust, and many other technologies by building demo projects
					which will be available on{" "}
					<NextChakraLink
						textDecoration={"underline"}
						href="https://github.com/dcbuild3r"
					>
						my GitHub
					</NextChakraLink>{" "}
					as I finish them. I'm looking forward to contributing to
					open-source projects and potentially joining a team
					full-time starting mid 2022.
				</Text>
			</VStack>
		</Layout>
	);
};

export default ProjectsPage;
