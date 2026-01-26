import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
	title: {
		default: "dcbuilder",
		template: "%s | dcbuilder",
	},
	description:
		"Research, Development, Angel Investing in cryptography, distributed systems, and AI",
	openGraph: {
		title: "dcbuilder.eth",
		description:
			"Research, Development, Angel Investing in cryptography, distributed systems, and AI",
		url: "https://dcbuilder.dev",
		siteName: "dcbuilder",
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "dcbuilder",
		description: "Research, Development, Angel Investing",
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
			<body className="antialiased">
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
