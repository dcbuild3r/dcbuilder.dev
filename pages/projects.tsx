import { VStack, Text } from "@chakra-ui/react";
import Layout from "components/Layout";
import Navbar from "components/Navbar";

const ProjectsPage: React.FC = () => {
	return (
		<Layout title="dcbuilder.dev - Projects">
			<Navbar />
			<VStack
				spacing={"100px"}
				mt={["200px", "200px", "150px", "150px"]}
				mb="100px"
				textAlign="center"
			>
				<Text w="70vw" fontSize="3xl">
					Hello
				</Text>
			</VStack>
		</Layout>
	);
};

export default ProjectsPage;
