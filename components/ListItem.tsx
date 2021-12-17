import { ChakraProps, Heading, HStack, Image } from "@chakra-ui/react";
import * as React from "react";
import { PropsWithChildren } from "react";

interface ItemProps {
	nest: string;
	size: typeof sizes[number];
}
export type ListItemProps = PropsWithChildren<ChakraProps & ItemProps>;

const sizes = ["sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"] as const;

const ListItem = (props: ListItemProps) => {
	return (
		<HStack
			alignSelf={"flex-start"}
			pl={["0", "0.", props.nest, props.nest]}
		>
			<Image src="images/arrow.png" height="1rem" />
			<Heading
				size={props.size}
				fontWeight={props.fontWeight ? props.fontWeight : 600}
			>
				{props.children}
			</Heading>
		</HStack>
	);
};

export default ListItem;
