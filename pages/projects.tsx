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
					I'm currently a research associate at{" "}
					<NextChakraLink
						href="https://www.alongside.finance/"
						textDecoration={"underline"}
					>
						Alongside
					</NextChakraLink>
					. I'm helping with designing a robust technical architecture
					for the market index product, deployment network selection,
					governance design and other related research. On the
					education front I'm working on creating a blockchain
					development guide -{" "}
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
					. I'm also thinking of starting a YouTube channel to teach
					intermediate/advanced crypto content that is technical in
					nature, too. Stay tuned.
				</Text>
				<Text w="70vw" fontSize="3xl">
					In the past, I worked as a blockchain researcher and
					technical writer for about two years at{" "}
					<NextChakraLink
						href="https://moralis.io/"
						textDecoration="underline"
					>
						Moralis
					</NextChakraLink>
					. I worked as a front end developer and I also have 2 years
					of experience building applications in the AI, ML and data
					science domains. I worked with Python, libraries likes
					Pandas, Numpy, Seaborn, scikit-learn, Tensorflow, Keras,
					OpenCV and many more. I also coded up websites using React,
					NextJs, Typescript and other web technologies.
				</Text>
				<Text w="70vw" fontSize="3xl">
					I'm currently exploring the blockchain development developer
					role, which means that I'm constantly improving my skills in
					Solidity, Rust, Cairo, Circom and many other technologies by
					building demo projects which will be available on{" "}
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
