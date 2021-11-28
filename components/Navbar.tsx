import * as React from "react";
import {
	Button,
	HStack,
	Icon,
	IconButton,
	useColorMode,
	Image,
	Box,
	VStack,
	useBoolean,
} from "@chakra-ui/react";
import { NextChakraLink } from "./NextChakraLink";
import styles from "./Navbar.module.css";

const Navbar: React.FunctionComponent = () => {
	return (
		<>
			<div className={styles.navbar}>
				<HStack>
					<HStack justifyContent="space-between">
						<NextChakraLink href="/">
							<Image src="/images/dcbuilder.png" height="40px" />
							dcbuilder.eth
						</NextChakraLink>
					</HStack>
					<HStack></HStack>
				</HStack>
			</div>
		</>
	);
};
export default Navbar;
