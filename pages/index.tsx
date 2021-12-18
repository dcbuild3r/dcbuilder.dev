import { Stack, Box, Heading, VStack } from "@chakra-ui/react";
import Layout from "components/Layout";
import { MotionImage } from "components/MotionImage";
import Navbar from "components/Navbar";
import ListItem from "components/ListItem";

const IndexPage = () => {
	return (
		<Layout title="dcbuilder">
			<Navbar />
			<Stack
				mt={["180px", "180px", "130px", "130px"]}
				display="flex"
				p={3}
				pr={8}
				flexDirection={[
					"column-reverse",
					"column-reverse",
					"column-reverse",
					"row",
				]}
				alignItems={"center"}
			>
				<Box
					display="flex"
					justifyContent="center"
					w={["100vw", "100vw", "100vw", "60vw"]}
					flexGrow={2}
				>
					<MotionImage
						src={"images/kaneki.png"}
						w="80%"
						alignSelf="center"
					/>
				</Box>
				<VStack
					justifyContent={[
						"center",
						"center",
						"center",
						"flex-start",
					]}
					spacing={10}
					alignSelf={["center", "center", "center", "flex-start"]}
				>
					<VStack
						display={"flex"}
						flexDirection={"column"}
						w="30vw"
						spacing={"1.5rem"}
					>
						<Heading
							size={"lg"}
							textAlign={["center", "center", "center", "left"]}
						>
							Fullstack Blockchain Development
						</Heading>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							React, Next.js
						</ListItem>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							Solidity
						</ListItem>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							Hardhat, ethers
						</ListItem>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							dapp.tools, Foundry
						</ListItem>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							Rust
						</ListItem>
					</VStack>
					<VStack
						display={"flex"}
						flexDirection={"column"}
						w="30vw"
						justifyContent={[
							"center",
							"center",
							"flex-start",
							"flex-start",
						]}
						alignSelf={[
							"center",
							"center",
							"flex-start",
							"flex-start",
						]}
						spacing={"1.5rem"}
					>
						<Heading
							size="lg"
							alignSelf={[
								"center",
								"center",
								"flex-start",
								"flex-start",
							]}
							justifyContent={"center"}
							textAlign={["center", "center", "center", "left"]}
						>
							Blockchain Research
						</Heading>
						<ListItem size="lg" nest="2rem" fontWeight={400}>
							Ethereum
						</ListItem>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							DeFi
						</ListItem>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							DAOs
						</ListItem>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							web3
						</ListItem>
					</VStack>
				</VStack>
			</Stack>
		</Layout>
	);
};

export default IndexPage;
