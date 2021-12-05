import SEO from "util/DefaultSEO";
import { theme } from "util/ChakraTheme";
import { DefaultSeo } from "next-seo";
import { ChakraProvider } from "@chakra-ui/react";
import { AppProps } from "next/app";
import React from "react";
import Head from "next/head";

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<>
			<Head>
				<link rel="shortcut icon" href="favicon.ico" />
			</Head>
			<DefaultSeo {...SEO} />
			<ChakraProvider theme={theme}>
				<Component {...pageProps} />
			</ChakraProvider>
		</>
	);
}

export default MyApp;
