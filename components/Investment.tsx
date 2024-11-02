import { Heading, VStack, Text } from "@chakra-ui/layout";
import { Box } from "@chakra-ui/react";
import * as React from "react";
import { MotionImage } from "./MotionImage";
import { NextChakraLink } from "./NextChakraLink";

export interface InvestmentProps {
	title: string;
	description: string;
	imageURL: string;
	imageSource: string;
	imageWidth: string[];
	bgColor: string;
}

const Investment = (props: InvestmentProps) => {
	return (
		<VStack
			alignSelf={["center", "center", "center", "center"]}
			textAlign={["center", "center", "center", "center"]}
			bgColor={`${props.bgColor}`}
			display={"flex"}
			h="auto"
			pt={20}
			mb="60px"
		>
			<Box
				w="40vw"
				display="flex"
				alignContent={"center"}
				justifyContent={"center"}
				alignItems={"center"}
				alignSelf="center"
				mb="60px"
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
			<VStack w="55vw" mb="3rem">
				<Heading
					color={props.bgColor === "black" ? "white" : "black"}
					fontSize="4xl"
					alignSelf={["center", "center", "center", "center"]}
					textAlign={["center", "center", "center", "center"]}
				>
					{props.title}
				</Heading>
				<Text
					color={props.bgColor === "black" ? "white" : "black"}
					fontSize="3xl"
					alignSelf={["center", "center", "center", "center"]}
					textAlign={["center", "center", "center", "center"]}
					w={["70vw", "70vw", "20vw", "20vw"]}
				>
					{props.description}
				</Text>
			</VStack>
		</VStack>
	);
};

export default Investment;
