# Next.js 15 Modernization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate dcbuilder.dev from Next.js 11/Chakra UI to Next.js 15/Tailwind CSS with App Router and system-based theming.

**Architecture:** Fresh Next.js 15 project replacing old Pages Router structure. Static pages with Tailwind utility classes. Dark/light mode via next-themes with CSS variables.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, next-themes

---

## Task 1: Initialize Fresh Next.js 15 Project

**Files:**

-   Delete: All existing files except `public/images/`, `docs/`, `.git`
-   Create: Fresh Next.js 15 project structure

**Step 1: Clean up old project files**

```bash
cd /Users/dcbuilder/Code/dcbuilder.dev/.worktrees/nextjs-modernization
# Preserve only what we need
mv public/images /tmp/dcbuilder-images-backup
mv docs /tmp/dcbuilder-docs-backup

# Remove everything except .git
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} \;
```

**Step 2: Create new Next.js 15 project**

```bash
cd /Users/dcbuilder/Code/dcbuilder.dev/.worktrees/nextjs-modernization
bunx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --turbopack
```

When prompted, accept defaults.

**Step 3: Restore preserved files**

```bash
rm -rf public/*  # Remove default Next.js assets
mv /tmp/dcbuilder-images-backup public/images
mv /tmp/dcbuilder-docs-backup docs
```

**Step 4: Install next-themes**

```bash
bun add next-themes
```

**Step 5: Verify project runs**

```bash
bun dev
```

Expected: Dev server starts at http://localhost:3000 with default Next.js page.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 15 project with Tailwind"
```

---

## Task 2: Set Up Theming (Dark/Light Mode)

**Files:**

-   Create: `src/components/ThemeProvider.tsx`
-   Create: `src/components/ThemeToggle.tsx`
-   Modify: `src/app/layout.tsx`
-   Modify: `src/app/globals.css`

**Step 1: Create ThemeProvider component**

Create `src/components/ThemeProvider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
		>
			{children}
		</NextThemesProvider>
	);
}
```

**Step 2: Create ThemeToggle component**

Create `src/components/ThemeToggle.tsx`:

```tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <div className="w-9 h-9" />;
	}

	return (
		<button
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
			aria-label="Toggle theme"
		>
			{theme === "dark" ? (
				<svg
					className="w-5 h-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
			) : (
				<svg
					className="w-5 h-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				</svg>
			)}
		</button>
	);
}
```

**Step 3: Update globals.css for theming**

Replace contents of `src/app/globals.css`:

```css
@import "tailwindcss";

:root {
	--background: #fafafa;
	--foreground: #171717;
}

.dark {
	--background: #0a0a0a;
	--foreground: #ededed;
}

body {
	background-color: var(--background);
	color: var(--foreground);
	font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
		sans-serif;
}
```

**Step 4: Update root layout**

Replace contents of `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
	title: "dcbuilder",
	description: "Research, Development, Angel Investing",
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
```

**Step 5: Verify theming works**

```bash
bun dev
```

Visit http://localhost:3000, check browser devtools for theme class on `<html>` element.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add dark/light mode theming with next-themes"
```

---

## Task 3: Create Navbar Component

**Files:**

-   Create: `src/components/Navbar.tsx`

**Step 1: Create Navbar component**

Create `src/components/Navbar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
	{ href: "/", label: "Home" },
	{ href: "/about", label: "About" },
	{ href: "/portfolio", label: "Portfolio" },
];

export function Navbar() {
	const pathname = usePathname();

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800">
			<div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
				<Link
					href="/"
					className="text-xl font-bold hover:opacity-70 transition-opacity"
				>
					dcbuilder
				</Link>
				<div className="flex items-center gap-6">
					{navLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className={`hover:opacity-70 transition-opacity ${
								pathname === link.href
									? "font-medium"
									: "text-neutral-600 dark:text-neutral-400"
							}`}
						>
							{link.label}
						</Link>
					))}
					<ThemeToggle />
				</div>
			</div>
		</nav>
	);
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Navbar component with navigation links"
```

---

## Task 4: Create Data Files for Portfolio Content

**Files:**

-   Create: `src/data/affiliations.ts`
-   Create: `src/data/investments.ts`

**Step 1: Create affiliations data**

Create `src/data/affiliations.ts`:

```ts
export interface Affiliation {
	title: string;
	role: string;
	dateBegin: string;
	dateEnd: string;
	description: string;
	imageUrl: string;
	logo: string;
}

export const affiliations: Affiliation[] = [
	{
		title: "World Foundation",
		role: "Research Engineer",
		dateBegin: "Feb 2024",
		dateEnd: "Present",
		description:
			"Working on the World Foundation Human Collective Grants program (world.org/community-grants), protocol research and development, decentralization of the World ecosystem, and supporting the World mission.",
		imageUrl: "https://world.org/",
		logo: "/images/worldcoin_foundation.png",
	},
	{
		title: "Tools For Humanity",
		role: "Research Engineer",
		dateBegin: "July 2022",
		dateEnd: "Feb 2024",
		description:
			"Tools for Humanity are the main developers of the World project. As a research engineer on the protocol team at TfH I worked on all the core parts of World ID protocol, the Semaphore merkle tree batcher circuits (SMTB), the signup sequencer, the state bridge contracts and various other parts of the protocol.",
		imageUrl: "https://world.org/",
		logo: "/images/tfh.png",
	},
	{
		title: "Bagel",
		role: "Advisor",
		dateBegin: "Aug 2024",
		dateEnd: "Present",
		description:
			"Bagel is a machine learning and cryptography research lab building a neutral, peer-to-peer AI ecosystem that covers the complete machine learning lifecycle.",
		imageUrl: "https://bagel.net/",
		logo: "/images/bagel.png",
	},
	{
		title: "Modulus Labs",
		role: "Advisor",
		dateBegin: "Oct 2023",
		dateEnd: "Dec 2024",
		description:
			"Modulus specializes in making artificial intelligence accountable through the use of advanced cryptography including ZK and MPC. Modulus Labs was acquired by Tools For Humanity in December of 2024.",
		imageUrl:
			"https://world.org/blog/announcements/modulus-labs-joins-tfh-support-applied-research-world",
		logo: "/images/modulus.png",
	},
	{
		title: "devpill.me",
		role: "Creator",
		dateBegin: "Aug 2021",
		dateEnd: "Present",
		description:
			"I created devpill.me, which is a public good blockchain development guide aimed at becoming the go-to learning resource aggregator for building on Ethereum and its wider ecosystem.",
		imageUrl: "https://www.devpill.me/",
		logo: "/images/devpill.png",
	},
	{
		title: "ETHPrague",
		role: "Coorganizer",
		dateBegin: "Dec 2021",
		dateEnd: "Present",
		description:
			"ETHPrague is a 3-day organized conference by local members of the Ethereum community that takes place every year.",
		imageUrl: "https://ethprague.com/",
		logo: "/images/ethprague.png",
	},
	{
		title: "Alongside",
		role: "Research Engineer",
		dateBegin: "Mar 2022",
		dateEnd: "July 2022",
		description:
			"Alongside is a protocol that allows anyone to get crypto market exposure in a few simple clicks. I was a research engineer focusing on decentralized custodians, secure multi-party computation, and governance structures.",
		imageUrl: "https://www.alongside.xyz/",
		logo: "/images/Alongside.png",
	},
	{
		title: "Moralis",
		role: "Blockchain researcher",
		dateBegin: "Jul 2020",
		dateEnd: "Mar 2022",
		description:
			"Moralis is a web3 development platform that allows for an easy and simple dapp development experience. I worked as a researcher and writer for their weekly research publications.",
		imageUrl: "https://moralis.io/",
		logo: "/images/moralis.png",
	},
];
```

**Step 2: Create investments data**

Create `src/data/investments.ts`:

```ts
export interface Investment {
	title: string;
	description: string;
	imageUrl: string;
	logo: string;
}

export const investments: Investment[] = [
	{
		title: "Accountable",
		description: "The New Wave of Verifiable Credit",
		imageUrl: "https://www.accountable.capital/",
		logo: "/images/investments/accountable.png",
	},
	{
		title: "Agora",
		description: "The Onchain Governance Company",
		imageUrl: "https://agora.xyz/",
		logo: "/images/investments/agora.png",
	},
	{
		title: "Aligned Layer",
		description: "Fast and Cheap Proof Verification",
		imageUrl: "https://alignedlayer.com/",
		logo: "/images/investments/aligned.png",
	},
	{
		title: "Astria",
		description: "The Sequencing Layer",
		imageUrl: "https://www.astria.org/",
		logo: "/images/investments/astria.png",
	},
	{
		title: "Atoma",
		description: "Decentralized AI Private Cloud",
		imageUrl: "https://www.atoma.network/",
		logo: "/images/investments/atoma.png",
	},
	{
		title: "Berachain",
		description:
			"EVM L1 Turning Liquidity into Security with Proof Of Liquidity",
		imageUrl: "https://www.berachain.com/",
		logo: "/images/investments/berachain.png",
	},
	{
		title: "blocksense",
		description: "The ZK Rollup for Verifiable Data and Compute Services",
		imageUrl: "https://blocksense.network/",
		logo: "/images/investments/blocksense.png",
	},
	{
		title: "Clique",
		description: "TEE Coprocessors for Onchain Applications",
		imageUrl: "https://www.clique.tech/",
		logo: "/images/investments/clique.png",
	},
	{
		title: "Delta",
		description: "A New Type of Permissionless Network",
		imageUrl: "https://www.delta.network/",
		logo: "/images/investments/delta.png",
	},
	{
		title: "Eclipse",
		description: "Solana on Ethereum",
		imageUrl: "https://www.eclipse.xyz/",
		logo: "/images/investments/eclipse.png",
	},
	{
		title: "Exo",
		description: "AI on Any Device",
		imageUrl: "https://exolabs.net/",
		logo: "/images/investments/exo.png",
	},
	{
		title: "Fabric Cryptography",
		description: "A New Kind of Chip for Cryptography",
		imageUrl: "https://www.fabriccryptography.com/",
		logo: "/images/investments/fabric.png",
	},
	{
		title: "FirstBatch",
		description: "Enabling The Path to Safe AGI Through Collaboration",
		imageUrl: "https://www.firstbatch.xyz/",
		logo: "/images/investments/firstbatch.png",
	},
	{
		title: "Friend",
		description: "AI Companions for Everyone",
		imageUrl: "https://friend.com",
		logo: "/images/investments/friend.png",
	},
	{
		title: "GasHawk",
		description: "Save on Ethereum Gas Fees, Automatically and Securely",
		imageUrl: "https://www.gashawk.io/",
		logo: "/images/investments/gashawk.png",
	},
	{
		title: "GatlingX",
		description: "GPU-EVM",
		imageUrl: "https://x.com/Gatling_X",
		logo: "/images/investments/gatlingx.png",
	},
	{
		title: "Gevulot",
		description: "Internet Scale Compute Network for Zero-Knowledge Proofs",
		imageUrl: "https://www.gevulot.com/",
		logo: "/images/investments/gevulot.png",
	},
	{
		title: "Giza",
		description: "Actionable AI for decentralized applications",
		imageUrl: "https://www.gizatech.xyz/",
		logo: "/images/investments/giza.png",
	},
	{
		title: "Happy Chain",
		description: "The Simple Happy Game Chain",
		imageUrl: "https://linktr.ee/happychaindevs",
		logo: "/images/investments/happy_chain.png",
	},
	{
		title: "Herodotus",
		description: "Verifiable Onchain Data and Compute",
		imageUrl: "https://herodotus.dev/",
		logo: "/images/investments/herodotus.png",
	},
	{
		title: "Inco",
		description: "The Confidentiality Layer",
		imageUrl: "https://www.inco.org/",
		logo: "/images/investments/inco.png",
	},
	{
		title: "Intuition",
		description: "The Trust Protocol",
		imageUrl: "https://intuition.systems/",
		logo: "/images/investments/intuition.png",
	},
	{
		title: "JokeRace",
		description: "Contests for Communities to Run, Grow, and Monetize",
		imageUrl: "https://www.jokerace.io/",
		logo: "/images/investments/jokerace.png",
	},
	{
		title: "Lighter",
		description: "Perpetuals with Unmatched Efficiency and Fairness",
		imageUrl: "https://lighter.xyz/",
		logo: "/images/investments/lighter.png",
	},
	{
		title: "MegaETH",
		description: "The Real-Time Ethereum Layer 2",
		imageUrl: "https://megaeth.systems/",
		logo: "/images/investments/megaeth.png",
	},
	{
		title: "Mind Palace",
		description: "Your Personal Time Machine",
		imageUrl: "https://www.mindpalace.ai/",
		logo: "/images/investments/mind-palace.png",
	},
	{
		title: "Mizu",
		description: "Unified Liquidity Layer",
		imageUrl: "https://mizulabs.xyz/",
		logo: "/images/investments/mizu.png",
	},
	{
		title: "Mode",
		description:
			"Scaling DeFi through AI agents and Financial Applications",
		imageUrl: "https://www.mode.network/",
		logo: "/images/investments/mode.png",
	},
	{
		title: "Monad",
		description: "The Most Performant EVM-Compatible Layer 1 Blockchain",
		imageUrl: "https://www.monad.xyz/",
		logo: "/images/investments/monad.png",
	},
	{
		title: "Morpho",
		description: "The Most Efficient Lending Protocol",
		imageUrl: "https://morpho.org/",
		logo: "/images/investments/morpho.png",
	},
	{
		title: "Movement",
		description: "Bringing Move to Ethereum and Beyond",
		imageUrl: "https://movementlabs.xyz/",
		logo: "/images/investments/movement.png",
	},
	{
		title: "Nebra",
		description: "Bringing Proof Singularity to Blockchains",
		imageUrl: "https://nebra.one/",
		logo: "/images/investments/nebra.png",
	},
	{
		title: "Nillion",
		description: "The Blind Computer",
		imageUrl: "https://nillion.com/",
		logo: "/images/investments/nillion.png",
	},
	{
		title: "OnlyDust",
		description: "Open Source Development Funding Platform",
		imageUrl: "https://www.onlydust.com/",
		logo: "/images/investments/onlydust.png",
	},
	{
		title: "OpenQ",
		description: "Drive More Value through Developer Relations",
		imageUrl: "https://openq.dev/",
		logo: "/images/investments/openq.png",
	},
	{
		title: "Phylax",
		description: "Building the Credible Layer",
		imageUrl: "https://phylax.watch/",
		logo: "/images/investments/phylax.png",
	},
	{
		title: "Pimlico",
		description: "Build with Smart Accounts",
		imageUrl: "https://www.pimlico.io/",
		logo: "/images/investments/pimlico.png",
	},
	{
		title: "PIN AI",
		description: "The Open Platform for Personal AI",
		imageUrl: "https://pinai.io/",
		logo: "/images/investments/pinai.png",
	},
	{
		title: "Pluto",
		description: "Verifiable Web Data for Applications",
		imageUrl: "https://pluto.xyz/",
		logo: "/images/investments/pluto.png",
	},
	{
		title: "Pragma",
		description: "The Open Infrastructure for Oracles",
		imageUrl: "https://www.pragma.build/",
		logo: "/images/investments/pragma.png",
	},
	{
		title: "Praxis",
		description: "The Next America Built on the Internet",
		imageUrl: "https://www.praxisnation.com/",
		logo: "/images/investments/praxis.png",
	},
	{
		title: "Prime Intellect",
		description: "Find Compute. Train Models. Co-Own Intelligence.",
		imageUrl: "https://www.primeintellect.ai/",
		logo: "/images/investments/prime-intellect.png",
	},
	{
		title: "PWN",
		description: "DeFi Lending Reimagined",
		imageUrl: "https://pwn.xyz/",
		logo: "/images/investments/pwn.png",
	},
	{
		title: "Rhinestone",
		description: "Build Powerful Onchain Products with Seamless UX",
		imageUrl: "https://www.rhinestone.wtf/",
		logo: "/images/investments/rhinestone.png",
	},
	{
		title: "Ritual",
		description: "The World's Sovereign Chain for AI",
		imageUrl: "https://ritual.net/",
		logo: "/images/investments/ritual.png",
	},
	{
		title: "Sorella",
		description: "Sustainable on-chain Markets",
		imageUrl: "https://sorellalabs.xyz/",
		logo: "/images/investments/sorella.png",
	},
	{
		title: "Succinct",
		description: "Prove the World's Software",
		imageUrl: "https://succinct.xyz/",
		logo: "/images/investments/succinct.png",
	},
	{
		title: "Wildcat",
		description: "Fixed Rates, Flexible Everything Else",
		imageUrl: "https://wildcat.finance/",
		logo: "/images/investments/wildcat.png",
	},
	{
		title: "Lucis",
		description:
			"Advanced Diagnostics and Tools for Health Performance and Longevity",
		imageUrl: "https://lucis.life/",
		logo: "/images/investments/lucis.png",
	},
];
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add portfolio data files for affiliations and investments"
```

---

## Task 5: Build Home Page

**Files:**

-   Modify: `src/app/page.tsx`

**Step 1: Create home page**

Replace contents of `src/app/page.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
	return (
		<>
			<Navbar />
			<main className="min-h-screen pt-24 px-6">
				<div className="max-w-5xl mx-auto">
					<div className="flex flex-col-reverse lg:flex-row items-center gap-12 py-12">
						{/* Image */}
						<div className="lg:w-1/2 flex justify-center">
							<Image
								src="/images/kaneki.png"
								alt="dcbuilder"
								width={400}
								height={400}
								className="w-full max-w-md"
								priority
							/>
						</div>

						{/* Content */}
						<div className="lg:w-1/2 space-y-12">
							{/* Research */}
							<section>
								<h2 className="text-2xl font-bold mb-4">
									Research
								</h2>
								<ul className="space-y-2 text-lg text-neutral-700 dark:text-neutral-300">
									<li>• Ethereum</li>
									<li>
										• Programmable Cryptography (ZK, FHE,
										MPC, TEE)
									</li>
									<li>• Digital Identity</li>
									<li>• Distributed Systems</li>
									<li>• Decentralized AI</li>
								</ul>
							</section>

							{/* Development */}
							<section>
								<h2 className="text-2xl font-bold mb-4">
									Development
								</h2>
								<ul className="space-y-2 text-lg text-neutral-700 dark:text-neutral-300">
									<li>• Rust</li>
									<li>• Solidity</li>
								</ul>
							</section>

							{/* Angel Investing */}
							<section>
								<h2 className="text-2xl font-bold mb-4">
									Angel Investing
								</h2>
								<p className="text-lg text-neutral-700 dark:text-neutral-300">
									Supporting teams building cool things in the
									areas of programmable cryptography,
									distributed systems, digital identity, AI,
									scalability, privacy, and more. Read more in
									the{" "}
									<Link
										href="/portfolio"
										className="underline hover:opacity-70 transition-opacity"
									>
										Portfolio
									</Link>{" "}
									section.
								</p>
							</section>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
```

**Step 2: Verify home page**

```bash
bun dev
```

Visit http://localhost:3000 and verify:

-   Kaneki image displays
-   Research/Development/Angel Investing sections show
-   Theme toggle works
-   Responsive layout on mobile

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement home page with hero section"
```

---

## Task 6: Build About Page

**Files:**

-   Create: `src/app/about/page.tsx`

**Step 1: Create about page**

Create `src/app/about/page.tsx`:

```tsx
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { affiliations } from "@/data/affiliations";

export const metadata = {
	title: "dcbuilder - About",
};

export default function About() {
	return (
		<>
			<Navbar />
			<main className="min-h-screen pt-24 px-6">
				<div className="max-w-4xl mx-auto py-12 space-y-20">
					{/* Bio Section */}
					<section className="flex flex-col md:flex-row items-center gap-12">
						<Link href="/" className="shrink-0">
							<Image
								src="/images/dcbuilder.webp"
								alt="dcbuilder"
								width={200}
								height={200}
								className="rounded-full hover:scale-105 transition-transform"
							/>
						</Link>
						<div className="space-y-6 text-xl text-neutral-700 dark:text-neutral-300">
							<p>
								My meta-goal is to maximize the positive impact
								I have on the world to help people and take
								humanity to a new age of prosperity and
								abundance.
							</p>
							<p>
								After a few years of trying out different things
								I decided that cryptography and distributed
								systems are the domains that interest me the
								most.
							</p>
						</div>
					</section>

					{/* Affiliations Section */}
					<section>
						<h2 className="text-4xl font-bold text-center mb-12">
							Affiliations
						</h2>
						<div className="space-y-8">
							{affiliations.map((affiliation) => (
								<a
									key={affiliation.title}
									href={affiliation.imageUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="block p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
								>
									<div className="flex flex-col sm:flex-row gap-6">
										<div className="shrink-0 flex items-center justify-center sm:w-32">
											<Image
												src={affiliation.logo}
												alt={affiliation.title}
												width={100}
												height={100}
												className="object-contain bg-white rounded-lg p-2"
											/>
										</div>
										<div className="flex-1">
											<div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
												<h3 className="text-xl font-semibold">
													{affiliation.title}
												</h3>
												<span className="text-neutral-500 dark:text-neutral-400">
													• {affiliation.role}
												</span>
											</div>
											<p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
												{affiliation.dateBegin} –{" "}
												{affiliation.dateEnd}
											</p>
											<p className="text-neutral-700 dark:text-neutral-300">
												{affiliation.description}
											</p>
										</div>
									</div>
								</a>
							))}
						</div>
					</section>
				</div>
			</main>
		</>
	);
}
```

**Step 2: Verify about page**

```bash
bun dev
```

Visit http://localhost:3000/about and verify:

-   Profile image displays
-   Bio text shows
-   Affiliations list with logos
-   Links work

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement about page with bio and affiliations"
```

---

## Task 7: Build Portfolio Page

**Files:**

-   Create: `src/app/portfolio/page.tsx`

**Step 1: Create portfolio page**

Create `src/app/portfolio/page.tsx`:

```tsx
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { investments } from "@/data/investments";

export const metadata = {
	title: "dcbuilder - Portfolio",
};

export default function Portfolio() {
	return (
		<>
			<Navbar />
			<main className="min-h-screen pt-24 px-6">
				<div className="max-w-6xl mx-auto py-12 space-y-16">
					{/* Disclaimer */}
					<section className="text-center space-y-6">
						<h1 className="text-4xl font-bold">Disclaimer</h1>
						<p className="max-w-3xl mx-auto text-lg text-neutral-700 dark:text-neutral-300">
							All information and opinions presented on this
							website reflect only my personal views and
							experiences. They are not intended to represent or
							imply the views, policies, or endorsements of any
							organization, entity, or other individuals. The
							investments, strategies, and opinions expressed are
							solely my own and should not be considered financial
							advice. Please consult a qualified financial advisor
							before making any investment decisions.
						</p>
					</section>

					{/* Investments */}
					<section className="space-y-8">
						<h2 className="text-4xl font-bold text-center">
							Investments
						</h2>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{investments.map((investment) => (
								<a
									key={investment.title}
									href={investment.imageUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="group p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex flex-col items-center text-center"
								>
									<div className="w-24 h-24 mb-4 flex items-center justify-center">
										<Image
											src={investment.logo}
											alt={investment.title}
											width={80}
											height={80}
											className="object-contain bg-white rounded-lg p-2 group-hover:scale-105 transition-transform"
										/>
									</div>
									<h3 className="font-semibold mb-2">
										{investment.title}
									</h3>
									<p className="text-sm text-neutral-600 dark:text-neutral-400">
										{investment.description}
									</p>
								</a>
							))}
						</div>
					</section>
				</div>
			</main>
		</>
	);
}
```

**Step 2: Verify portfolio page**

```bash
bun dev
```

Visit http://localhost:3000/portfolio and verify:

-   Disclaimer section shows
-   Investment grid displays all logos
-   Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
-   Hover effects work

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement portfolio page with investments grid"
```

---

## Task 8: Add SEO Metadata

**Files:**

-   Modify: `src/app/layout.tsx`

**Step 1: Update root layout with SEO metadata**

Update `src/app/layout.tsx`:

```tsx
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
		title: "dcbuilder",
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
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add SEO metadata to root layout"
```

---

## Task 9: Final Cleanup and Build Verification

**Files:**

-   Remove: Any unused default Next.js files

**Step 1: Remove unused files**

```bash
cd /Users/dcbuilder/Code/dcbuilder.dev/.worktrees/nextjs-modernization
rm -f src/app/favicon.ico  # If you want to add your own later
```

**Step 2: Run production build**

```bash
bun run build
```

Expected: Build completes successfully with no errors.

**Step 3: Test production build**

```bash
bun run start
```

Visit http://localhost:3000 and verify all pages work in production mode.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: final cleanup and build verification"
```

---

## Post-Implementation: Merge or PR

After all tasks complete:

1. Verify the site works fully at http://localhost:3000
2. Test dark/light mode toggle
3. Test all navigation links
4. Test responsive layouts on mobile

Then either:

-   Create a PR: `gh pr create --title "Modernize to Next.js 15 + Tailwind" --body "..."`
-   Or merge directly: `git checkout master && git merge feature/nextjs-modernization`
