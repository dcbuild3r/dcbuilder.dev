import { VStack, Text } from "@chakra-ui/react";
import Layout from "components/Layout";
import ListItem from "components/ListItem";
import Navbar from "components/Navbar";
import { NextChakraLink } from "components/NextChakraLink";

const ProjectsPage: React.FC = () => {
	return (
		<Layout title="dcbuilder.dev - Projects">
			<Navbar />
			<VStack
				spacing={"50px"}
				mt={["200px", "200px", "150px", "150px"]}
				mb="100px"
				textAlign="left"
				align={"flex-start"}
				pl="4rem"
			>
				<Text maxW="90vw" fontSize="2rem">
					Some of the projects I have worked on:
				</Text>
				{/* <Text maxW="90vw" fontSize="2rem"> */}
				{/* Over the last two years I have worked on several production */}
				{/* projects and learned a lot of different things. I have */}
				{/* worked with complex infrastructure deployments where */}
				{/* services talk to other services and to the blockchain and */}
				{/* have to be mutually aware of each other's state. Partaking */}
				{/* in system architecture and systems thinking is something */}
				{/* that I have found really interesting when building a complex */}
				{/* solution around a protocol which needs to scale to a lot of */}
				{/* users. */}
				{/* </Text> */}
				{/* <Text maxW="90vw" fontSize="2rem"> */}
				{/* I have been exposed to orchestration through Terraform, k8s, */}
				{/* and Docker, to monitoring, observability and alerting */}
				{/* through DataDog, OpsGenie, OpenZeppelin Defender, and */}
				{/* Tenderly, I have learned what challenges arise when writing */}
				{/* complex integration tests in a cross-team collaboration */}
				{/* environment with many dependencies. I have worked primarily */}
				{/* with Solidity, Foundry, Rust, Golang and their ecosystem of */}
				{/* libraries and tools.{" "} */}
				{/* </Text> */}
				<ListItem size="lg" nest="2rem" fontWeight={"400"}>
					<NextChakraLink
						textDecoration="underline"
						href="https://github.com/worldcoin/world-id-contracts/"
					>
						world-id-contracts
					</NextChakraLink>
					{": "}
					Solidity contracts for the World ID protocol
				</ListItem>
				<ListItem size="lg" nest="2rem" fontWeight={"400"}>
					<NextChakraLink
						textDecoration="underline"
						href="https://github.com/worldcoin/world-id-contracts/"
					>
						world-id-state-bridge
					</NextChakraLink>
					{": "}
					Solidity contracts for bridging World ID state to Optimism
					and Polygon PoS
				</ListItem>
				<ListItem size="lg" nest="2rem" fontWeight={"400"}>
					<NextChakraLink
						textDecoration="underline"
						href="https://github.com/worldcoin/world-id-contracts/"
					>
						signup-sequencer
					</NextChakraLink>
					{": "}Rust service that sequences data (identities) that are
					committed in a batch to the World ID contracts.
				</ListItem>
				<ListItem size="lg" nest="2rem" fontWeight={"400"}>
					<NextChakraLink
						textDecoration="underline"
						href="https://github.com/worldcoin/world-id-contracts/"
					>
						ptau-deserializer
					</NextChakraLink>
					{": "}
					Powers of Tau format (snarkjs) deserializer for the gnark
					library written in Golang
				</ListItem>
				<ListItem size="lg" nest="2rem" fontWeight={"400"}>
					<NextChakraLink
						textDecoration="underline"
						href="https://github.com/worldcoin/world-id-contracts/"
					>
						semaphore-mtb
					</NextChakraLink>
					{": "}
					Semaphore Merkle Tree Batcher circuits for the World ID
					protocol
				</ListItem>
				<Text maxW="90vw" fontSize="2rem">
					As part of my transition from TFH to the Worldcoin
					Foundation I will be mostly focusing on protocol R&D and our{" "}
					<NextChakraLink
						href="https://worldcoin.org/community-grants"
						textDecoration={"underline"}
					>
						grants program
					</NextChakraLink>
					. Here you can check out the{" "}
					<NextChakraLink
						href="https://worldcoin.org/wave0-grant-recipients"
						textDecoration={"underline"}
					>
						list of grant recipients
					</NextChakraLink>{" "}
					for the wave0 of the grants program. I will be working with
					our grantees as well as with the wider community to help
					improve the Worldcoin tech tree.
				</Text>
				<Text maxW="90vw" fontSize="2rem">
					I am focusing on learning cryptography and abstract algebra
					as well as cryptography engineering especially around ZK for
					the foreseeable future. I want to become a better engineer,
					get a proper mathematical foundation and learn how to build
					secure and scalable cryptographic systems.
				</Text>
			</VStack>
		</Layout>
	);
};

export default ProjectsPage;
