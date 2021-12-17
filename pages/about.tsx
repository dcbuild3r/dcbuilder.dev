import { Box, Stack, VStack, Text, Heading } from "@chakra-ui/react";
import Layout from "components/Layout";
import { MotionImage } from "components/MotionImage";
import Navbar from "components/Navbar";
import { NextChakraLink } from "components/NextChakraLink";
import * as React from "react";
import affiliations from "components/Affiliations";
import Affiliation, { AffiliationProps } from "components/Affiliation";

const AboutPage: React.FC = () => {
	return (
		<Layout title="Waifus rule">
			<Navbar mb="100px" />
			<Stack display="flex" flexDir="column" spacing={"100px"}>
				<Stack
					display="flex"
					flexDir={["column", "column", "row", "row"]}
					justifyContent={"space-between"}
					alignContent="center"
					alignSelf="center"
					pt={20}
				>
					<Box alignSelf="center" padding={0}>
						<NextChakraLink href="/">
							<MotionImage
								src="/images/dcbuilder.png"
								borderRadius="50%"
								height={"30vh"}
								w={"auto"}
								whileHover={{ scale: 1.1 }}
								alignSelf="center"
								whileTap={{ scale: 0.8 }}
								mr="100px"
							/>
						</NextChakraLink>
					</Box>
					<VStack
						flexWrap="wrap"
						w={["80vw", "80vw", "50vw", "50vw"]}
						alignContent="center"
						justifyContent="center"
						alignSelf="center"
						p={8}
					>
						<Text fontSize={"3xl"} mb="2rem">
							My meta-goal is to maximize the positive impact I
							have on the world to help people and take humanity
							to a new age of prosperity and abundance.
						</Text>
						<Text fontSize={"3xl"}>
							After a few years of trying out different things I
							decided that crypto and web3 were the best tools for
							me to accomplish this.
						</Text>
					</VStack>
				</Stack>
				<Stack
					display="flex"
					justifyContent="center"
					alignItems="center"
				>
					<Heading fontSize="5xl">Affiliations</Heading>
					{affiliations.map((affiliation: AffiliationProps) => {
						return (
							<Affiliation
								title={affiliation.title}
								role={affiliation.role}
								dateBegin={affiliation.dateBegin}
								dateEnd={affiliation.dateEnd}
								description={affiliation.description}
								imageSource={affiliation.imageSource}
								imageURL={affiliation.imageURL}
								imageWidth={affiliation.imageWidth}
								bgColor={affiliation.bgColor}
							/>
						);
					})}
				</Stack>
			</Stack>
		</Layout>
	);
};

export default AboutPage;
