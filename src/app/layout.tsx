import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Lora } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PostHogProvider } from "@/lib/posthog";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, TWITTER_HANDLE } from "@/lib/site";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
});

const lora = Lora({
	variable: "--font-serif",
	subsets: ["latin"],
	weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
	title: {
		default: SITE_TITLE,
		template: `%s | ${SITE_TITLE}`,
	},
	description: SITE_DESCRIPTION,
	metadataBase: new URL(SITE_URL),
	manifest: "/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		title: SITE_TITLE,
		statusBarStyle: "black-translucent",
	},
	openGraph: {
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		url: SITE_URL,
		siteName: SITE_NAME,
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		creator: TWITTER_HANDLE,
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
			<body className={`${inter.variable} ${jetbrainsMono.variable} ${lora.variable} antialiased`}>
				<a href="#main-content" className="skip-link">
					Skip to main content
				</a>
				<PostHogProvider>
					<ThemeProvider>{children}</ThemeProvider>
				</PostHogProvider>
			</body>
		</html>
	);
}
