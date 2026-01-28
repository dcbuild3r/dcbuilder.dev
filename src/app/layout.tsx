import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PostHogProvider } from "@/lib/posthog";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: {
		default: "dcbuilder.eth",
		template: "%s | dcbuilder.eth",
	},
	description:
		"Research, Engineering, Angel Investing in cryptography, distributed systems, and AI",
	metadataBase: new URL("https://dcbuilder.dev"),
	openGraph: {
		title: "dcbuilder.eth",
		description:
			"Research, Engineering, Angel Investing in cryptography, distributed systems, and AI",
		url: "https://dcbuilder.dev",
		siteName: "dcbuilder",
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "dcbuilder.eth",
		description:
			"Research, Engineering, Angel Investing in cryptography, distributed systems, and AI",
		creator: "@dcbuilder",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
				<PostHogProvider>
					<ThemeProvider>{children}</ThemeProvider>
				</PostHogProvider>
			</body>
		</html>
	);
}
