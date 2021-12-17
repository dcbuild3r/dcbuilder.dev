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
		<Stack bgColor={`${props.bgColor}`} w="100vw" p={8}>
			<Stack
				display={"flex"}
				flexDirection={["column", "column", "row", "row"]}
				alignSelf="center"
			>
				<Box
					w="40vw"
					display="flex"
					alignContent={"center"}
					justifyContent={"center"}
					alignItems={"center"}
					alignSelf="center"
				>
					<NextChakraLink href={props.imageURL}>
						<MotionImage
							src={`/images/${props.imageSource}`}
							whileHover={{ scale: 1.2 }}
							whileTap={{ scale: 0.8 }}
							w={props.imageWidth}
							mr="0"
						/>
					</NextChakraLink>
				</Box>
				<VStack w="60vw">
					<Heading
						color={props.bgColor === "black" ? "white" : "black"}
						fontSize="4xl"
						alignSelf={[
							"center",
							"center",
							"flex-start",
							"flex-start",
						]}
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
						pr={8}
					>
						{props.description}
					</Text>
				</VStack>
			</Stack>
		</Stack>
	);
};

export default Affiliation;