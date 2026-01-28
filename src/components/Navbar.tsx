"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
	{ href: "/", label: "Home" },
	{ href: "/about", label: "About" },
	{ href: "/blog", label: "Blog" },
	{ href: "/news", label: "News" },
	{ href: "/portfolio", label: "Portfolio" },
	{ href: "/jobs", label: "Jobs" },
	{ href: "/candidates", label: "Candidates" },
];

export function Navbar() {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const firstFocusableRef = useRef<HTMLAnchorElement>(null);
	const lastFocusableRef = useRef<HTMLAnchorElement>(null);

	// Close mobile menu on route change
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: sync menu state with navigation
		setMobileMenuOpen(false);
	}, [pathname]);

	// Prevent body scroll when menu is open and manage focus
	useEffect(() => {
		if (mobileMenuOpen) {
			document.body.style.overflow = "hidden";
			// Focus first link when menu opens
			setTimeout(() => firstFocusableRef.current?.focus(), 100);
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [mobileMenuOpen]);

	// Handle keyboard navigation for focus trap
	const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			setMobileMenuOpen(false);
			menuButtonRef.current?.focus();
		}
		// Trap focus within menu
		if (e.key === "Tab") {
			if (e.shiftKey && document.activeElement === firstFocusableRef.current) {
				e.preventDefault();
				lastFocusableRef.current?.focus();
			} else if (!e.shiftKey && document.activeElement === lastFocusableRef.current) {
				e.preventDefault();
				firstFocusableRef.current?.focus();
			}
		}
	}, []);

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center">
				{/* Logo */}
				<Link
					href="/"
					className="text-xl font-bold hover:opacity-70 transition-opacity cursor-pointer"
				>
					dcbuilder.eth
				</Link>

				{/* Desktop: Center - Social Links (centered in remaining space) */}
				<div className="hidden md:flex flex-1 items-center justify-center gap-4">
					<a
						href="https://x.com/dcbuilder"
						target="_blank"
						rel="noopener noreferrer"
						className="p-2 hover:scale-110 transition-transform cursor-pointer"
						aria-label="X (Twitter)"
					>
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
							<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
						</svg>
					</a>
					<a
						href="https://github.com/dcbuild3r"
						target="_blank"
						rel="noopener noreferrer"
						className="p-2 hover:scale-110 transition-transform cursor-pointer"
						aria-label="GitHub"
					>
						<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
						</svg>
					</a>
				</div>

				{/* Desktop: Right - Navigation & Theme */}
				<div className="hidden md:flex items-center gap-6">
					{navLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className={`hover:opacity-70 transition-opacity cursor-pointer ${
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

				{/* Mobile: Right side controls */}
				<div className="flex md:hidden items-center gap-2">
					<ThemeToggle />
					<button
						ref={menuButtonRef}
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
						aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
						aria-expanded={mobileMenuOpen}
						aria-controls="mobile-menu"
					>
						{mobileMenuOpen ? (
							<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						) : (
							<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<line x1="3" y1="12" x2="21" y2="12" />
								<line x1="3" y1="6" x2="21" y2="6" />
								<line x1="3" y1="18" x2="21" y2="18" />
							</svg>
						)}
					</button>
				</div>
			</div>

			{/* Mobile Menu Overlay */}
			{mobileMenuOpen && (
				<div
					id="mobile-menu"
					role="dialog"
					aria-modal="true"
					aria-label="Navigation menu"
					onKeyDown={handleMenuKeyDown}
					className="md:hidden fixed inset-0 top-[var(--navbar-height)] bg-white dark:bg-neutral-900 z-[var(--z-sticky)]"
				>
					<div className="flex flex-col items-center p-6 space-y-6">
						{/* Nav Links - centered for easy thumb reach */}
						<div className="flex flex-col items-center space-y-4">
							{navLinks.map((link, index) => (
								<Link
									key={link.href}
									ref={index === 0 ? firstFocusableRef : undefined}
									href={link.href}
									className={`text-xl py-2 ${
										pathname === link.href
											? "font-semibold"
											: "text-neutral-600 dark:text-neutral-400"
									}`}
								>
									{link.label}
								</Link>
							))}
						</div>

						{/* Divider */}
						<div className="w-full border-t border-neutral-200 dark:border-neutral-800" />

						{/* Social Links */}
						<div className="flex items-center gap-4">
							<a
								href="https://x.com/dcbuilder"
								target="_blank"
								rel="noopener noreferrer"
								className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
								aria-label="X (Twitter)"
							>
								<svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
									<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
								</svg>
							</a>
							<a
								href="https://github.com/dcbuild3r"
								target="_blank"
								rel="noopener noreferrer"
								className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
								aria-label="GitHub"
								ref={lastFocusableRef}
							>
								<svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
								</svg>
							</a>
						</div>
					</div>
				</div>
			)}
		</nav>
	);
}
