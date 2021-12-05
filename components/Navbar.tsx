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
	Stack,
	Text,
	useBoolean,
	Link,
	Menu,
	MenuButton,
	MenuList,
	MenuItem,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { NextChakraLink } from "./NextChakraLink";
import { FaTwitter, FaGithub } from "react-icons/fa";
import styles from "./Navbar.module.css";
import { MotionImage } from "./MotionImage";
import { MotionBox } from "./MotionBox";
import { Fragment, useRef, useState } from "react";
import { Portal } from "@chakra-ui/portal";

const Backdrop = () => {
	return <div className={styles.modal_overlay}></div>;
};

const MenuOverlay = (props: any) => {
	return <></>;
};

const MenuOverlayItem = (props: any) => {
	return <></>;
};

const Navbar: React.FC = () => {
	const [mobileMenuShown, setMobileMenuShown] = useState(true);
	const ref = useRef();

	return (
		<Fragment>
			<div id="overlays" />
			<div className={styles.navbar}>
				<Stack
					p="10px 30px"
					ml="3"
					justifyContent={["center", " space-between"]}
					fontSize={[24, 28, 20, 30]}
					display="flex"
					flexDirection={["column", "column", "row", "row"]}
				>
					<Stack
						justifyContent="space-between"
						alignItems="center"
						alignContent="center"
						display="flex"
						flexDirection={"row"}
					>
						<HStack
							mr="20px"
							p="3"
							borderRadius="100"
							className={styles.avatar}
							justifyContent={["center", "auto", "auto", "auto"]}
							alignItems="center"
						>
							<NextChakraLink href="/">
								<MotionImage
									src="/images/dcbuilder.png"
									borderRadius="50%"
									height="60px"
									whileHover={{ scale: 1.2 }}
									whileTap={{ scale: 0.8 }}
								/>
							</NextChakraLink>
							<NextChakraLink href="https://app.ens.domains/name/dcbuilder.eth/details">
								dcbuilder.eth
							</NextChakraLink>
						</HStack>
						<Button
							display={["flex", "flex", "none", "none"]}
							background="white"
							border="1px solid"
							borderColor="gray.400"
							w="15vw"
							justifyContent="center"
							alignSelf="center"
						>
							<HamburgerIcon />
						</Button>
					</Stack>
					<HStack
						display="flex"
						css={{ columnGap: "1rem" }}
						w={["60vw", "60vw", "auto", "auto"]}
						justifyContent="center"
						alignSelf="center"
					>
						<NextChakraLink href="https://twitter.com/DCbuild3r">
							<MotionBox
								whileHover={{ scale: 1.3 }}
								whileTap={{ scale: 0.8 }}
								height={["50px", "50px", "30px", "30px"]}
							>
								<FaTwitter size="auto" />
							</MotionBox>
						</NextChakraLink>
						<NextChakraLink href="https://opensea.io/DCBuilder">
							<MotionImage
								src="/images/opensea.png"
								height={["50px", "50px", "30px", "30px"]}
								whileHover={{ scale: 1.3 }}
								whileTap={{ scale: 0.8 }}
							/>
						</NextChakraLink>
						<NextChakraLink href="https://github.com/dcbuild3r">
							<MotionBox
								whileHover={{ scale: 1.3 }}
								whileTap={{ scale: 0.8 }}
								height={["50px", "50px", "30px", "30px"]}
							>
								<FaGithub size="auto" />
							</MotionBox>
						</NextChakraLink>
					</HStack>
					<VStack display={["none"]}>
						<NextChakraLink href="/about" mt="8px">
							About
						</NextChakraLink>
						<NextChakraLink href="/research">
							Research
						</NextChakraLink>
						<NextChakraLink href="/projects">
							Projects
						</NextChakraLink>
						<NextChakraLink href="/contact">Contact</NextChakraLink>
					</VStack>
					<Stack
						flexDirection={["column", "column", "row", "row"]}
						display={["none", "none", "flex", "flex"]}
						css={{ columnGap: "1rem" }}
						alignItems="center"
						alignContent="center"
						justifyContent="center"
					>
						<NextChakraLink href="/about" mt="8px">
							About
						</NextChakraLink>
						<NextChakraLink href="/research">
							Research
						</NextChakraLink>
						<NextChakraLink href="/projects">
							Projects
						</NextChakraLink>
						<NextChakraLink href="/contact">Contact</NextChakraLink>
					</Stack>
				</Stack>
			</div>
		</Fragment>
	);
};
export default Navbar;
