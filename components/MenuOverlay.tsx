import * as React from "react";
import { Box, Button, VStack } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { NextChakraLink } from "./NextChakraLink";
interface MenuOverlayProps {
	menuHandler: () => void;
}

const MenuOverlay = (props: MenuOverlayProps) => {
	return (
		<Box
			zIndex="40"
			position="fixed"
			w="100%"
			h="100vh"
			backdropFilter={"blur(20px)"}
		>
			<Button
				leftIcon={<CloseIcon h={8} w={8} />}
				position="absolute"
				right="2rem"
				top="2rem"
				h={20}
				backgroundColor="transparent"
				onClick={props.menuHandler}
			/>
			<VStack
				fontSize="30px"
				display="flex"
				justifyContent="space-evenly"
				alignContent="center"
				h="100vh"
				w="100vw"
				onClick={props.menuHandler}
				pt="2rem"
			>
				<MenuOverlayItem href="/about" onClick={props.menuHandler}>
					About
				</MenuOverlayItem>
				<MenuOverlayItem href="/research" onClick={props.menuHandler}>
					Research
				</MenuOverlayItem>
				<MenuOverlayItem href="/projects" onClick={props.menuHandler}>
					Projects
				</MenuOverlayItem>
				<MenuOverlayItem href="contact" onClick={props.menuHandler}>
					Contact
				</MenuOverlayItem>
			</VStack>
		</Box>
	);
};

const MenuOverlayItem = (props: any) => {
	return (
		<NextChakraLink href={props.href}>
			<Box>{props.children}</Box>
		</NextChakraLink>
	);
};

export default MenuOverlay;
