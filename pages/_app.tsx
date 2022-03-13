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
				<title>DCBuilder</title>
				<meta
					name="viewport"
					content="initial-scale=1.0, width=device-width"
				/>
				<meta
					name="description"
					content="dcbuilder.eth - full-stack blockchain developer and researcher engineer at Alongside Finance. Ethereum, devpill.me, TribeDAO, Waifus Anonymous."
				/>
				<meta
					property="og:image"
					content="https://raw.githubusercontent.com/dcbuild3r/dcbuilder.dev/master/public/images/dcbuilder.webp"
				/>
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
