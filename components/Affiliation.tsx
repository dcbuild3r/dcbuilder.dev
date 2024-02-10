import { Heading, Stack, VStack, Text } from "@chakra-ui/layout";
import { Box } from "@chakra-ui/react";
import * as React from "react";
import { MotionImage } from "./MotionImage";
import { NextChakraLink } from "./NextChakraLink";

export interface AffiliationProps {
	title: string;
	role: string;
	dateBegin: string;
	dateEnd: string;
	description: string;
	imageURL: string;
	imageSource: string;
	imageWidth: string[];
	bgColor: string;
}

const Affiliation = (props: AffiliationProps) => {
	return (
		<VStack bgColor={`${props.bgColor}`} display={"flex"} h="auto" pt={16}>
			<Stack
				display={"flex"}
				flexDirection={["column", "column", "row", "row"]}
				alignSelf="center"
				flexWrap={["wrap", "wrap", "wrap", "nowrap"]}
			>
				<Box
					w="40vw"
					display="flex"
					alignContent={"center"}
					justifyContent={"center"}
					alignItems={"center"}
					alignSelf="center"
				>
					<NextChakraLink href={props.imageURL} target="_blank">
						<MotionImage
							src={`/images/${props.imageSource}`}
							whileHover={{ scale: 1.2 }}
							whileTap={{ scale: 0.8 }}
							w={props.imageWidth}
							mr="0"
						/>
					</NextChakraLink>
				</Box>
				<VStack w="55vw">
					<Heading
						color={props.bgColor === "black" ? "white" : "black"}
						fontSize="4xl"
						alignSelf={[
							"center",
							"center",
							"flex-start",
							"flex-start",
						]}
						textAlign={["center", "center", "start", "start"]}
					>
						{props.title}
					</Heading>
					<Heading
						color={props.bgColor === "black" ? "white" : "black"}
						fontSize="3xl"
						alignSelf={[
							"center",
							"center",
							"flex-start",
							"flex-start",
						]}
						textAlign={["center", "center", "start", "start"]}
					>
						{props.role}
					</Heading>
					<Heading
						color={props.bgColor === "black" ? "white" : "black"}
						fontSize="2xl"
						alignSelf={[
							"center",
							"center",
							"flex-start",
							"flex-start",
						]}
						textAlign={["center", "center", "start", "start"]}
					>{`${props.dateBegin} - ${props.dateEnd}`}</Heading>
					<Text
						color={props.bgColor === "black" ? "white" : "black"}
						fontSize="lg"
						alignSelf={[
							"center",
							"center",
							"flex-start",
							"flex-start",
						]}
						textAlign={["center", "center", "start", "start"]}
						w="50vw"
					>
						{props.description}
					</Text>
				</VStack>
			</Stack>
		</VStack>
	);
};

export default Affiliation;
