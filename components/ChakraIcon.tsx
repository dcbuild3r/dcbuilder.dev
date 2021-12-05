import { ChakraProps, Icon } from "@chakra-ui/react";
import React from "react";

const CircleIcon = (props: ChakraProps, icon: React.Component) => (
	<Icon viewBox="0 0 200 200" {...props}>
		{icon}
	</Icon>
);

export default <ChakraIcon></ChakraIcon>;
