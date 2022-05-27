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
							Development
						</Heading>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							React, Next.js
						</ListItem>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							Solidity, Yul
						</ListItem>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							Foundry
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
							Research
						</Heading>
						<ListItem size="lg" nest="2rem" fontWeight={400}>
							Ethereum
						</ListItem>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							Scaling solutions (rollups, validiums, volitions,
							...)
						</ListItem>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							Public goods
						</ListItem>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							ZK
						</ListItem>
						<ListItem size="lg" nest="2rem" fontWeight={"400"}>
							MEV (looking into marketplace design)
						</ListItem>
					</VStack>
				</VStack>
			</Stack>
		</Layout>
	);
};

export default IndexPage;
