import {
	VStack,
	Text,
	Heading,
	SimpleGrid,
	Box,
	Container,
} from "@chakra-ui/react";
import Layout from "components/Layout";
import Navbar from "components/Navbar";
import React from "react";
import investments from "components/Investments";
import Investment, { InvestmentProps } from "components/Investment";

const PortfolioPage: React.FC = () => {
	return (
		<Layout title="dcbuilder.dev - Portfolio">
			<Navbar />
			<Box overflowX="hidden">
				<VStack
					gap="200px"
					mb="100px"
					mt={["200px", "200px", "150px", "150px"]}
					textAlign="center"
				>
					<Heading fontSize="5xl">Disclaimer</Heading>
					<Text maxW="60vw" fontSize="2xl">
						All information and opinions presented on this website
						reflect only my personal views and experiences. They are
						not intended to represent or imply the views, policies,
						or endorsements of any organization, entity, or other
						individuals. The investments, strategies, and opinions
						expressed are solely my own and should not be considered
						financial advice. Please consult a qualified financial
						advisor before making any investment decisions.
					</Text>
					<Heading fontSize="5xl">Investments</Heading>
					<Container maxW="80%">
						<SimpleGrid
							columns={[1, 1, 2, 3]}
							gap="10px"
							width="full"
						>
							{investments.map((investment: InvestmentProps) => (
								<Investment
									key={investment.title}
									title={investment.title}
									description={investment.description}
									imageSource={investment.imageSource}
									imageURL={investment.imageURL}
									imageWidth={["225px"]}
									bgColor={investment.bgColor}
								/>
							))}
						</SimpleGrid>
					</Container>
				</VStack>
			</Box>
		</Layout>
	);
};

export default PortfolioPage;
