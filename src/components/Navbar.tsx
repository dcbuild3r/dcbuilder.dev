"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { McpDialog } from "./McpDialog";
import { GitHubIcon, XIcon } from "./ui/icons";
import { cn } from "@/lib/utils";

const navLinks = [
	{ href: "/about", label: "About" },
	{ href: "/blog", label: "Blog" },
	{ href: "/news", label: "News" },
	{ href: "/portfolio", label: "Portfolio" },
	{ href: "/jobs", label: "Jobs" },
	{ href: "/candidates", label: "Candidates" },
];

const isActive = (pathname: string, href: string) =>
	pathname === href || pathname.startsWith(`${href}/`);

function Logo({ onClick }: { onClick?: () => void }) {
	return (
		<Link
			href="/"
			onClick={onClick}
			className="inline-flex min-h-11 items-center gap-2.5 text-[17px] font-bold tracking-[-0.02em] text-ink"
		>
			<Image src="/avatar.png" alt="" width={30} height={30} className="size-[30px] rounded-full object-cover" />
			dcbuilder.eth
		</Link>
	);
}

const mcpPill = "inline-flex items-center rounded-full bg-inverse font-mono text-xs font-bold text-inverse-ink";
const iconLink = "size-11 items-center justify-center text-body hover:text-accent";
const squareButton = "size-11 cursor-pointer items-center justify-center rounded-xl bg-surface-2 text-ink";
const menuSocial = "inline-flex size-12 items-center justify-center rounded-[14px] border border-line text-ink";

export function Navbar() {
	const pathname = usePathname();
	const [menuState, setMenuState] = useState(() => ({ open: false, path: pathname }));
	const [mcpOpen, setMcpOpen] = useState(false);
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	const isMenuOpen = menuState.open && menuState.path === pathname;

	const openMenu = useCallback(() => {
		setMenuState({ open: true, path: pathname });
	}, [pathname]);

	const closeMenu = useCallback(() => {
		setMenuState((prev) => (prev.open ? { ...prev, open: false } : prev));
	}, []);

	useEffect(() => {
		if (!isMenuOpen) return;
		document.body.style.overflow = "hidden";
		menuRef.current?.querySelector<HTMLElement>("button")?.focus();
		return () => {
			document.body.style.overflow = "";
		};
	}, [isMenuOpen]);

	const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			closeMenu();
			menuButtonRef.current?.focus();
			return;
		}
		if (e.key !== "Tab") return;
		const focusable = menuRef.current?.querySelectorAll<HTMLElement>("a[href], button");
		if (!focusable?.length) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}, [closeMenu]);

	return (
		<>
			<header className="sticky top-0 z-[var(--z-sticky)] bg-ground/85 backdrop-blur-md">
				<div className="mx-auto flex max-w-[1200px] items-center justify-between gap-x-6 gap-y-2 px-6 py-2.5 sm:max-lg:px-10">
					<Logo />

					<nav aria-label="Primary" className="hidden items-center gap-0.5 rounded-[26px] bg-surface-2 p-[3px] text-[14.5px] font-medium lg:flex">
						{navLinks.map((link) => {
							const active = isActive(pathname, link.href);
							return (
								<Link
									key={link.href}
									href={link.href}
									aria-current={active ? "page" : undefined}
									className={cn(
										"inline-flex min-h-11 items-center rounded-full px-4",
										active ? "bg-inverse font-semibold text-inverse-ink" : "text-body hover:text-accent",
									)}
								>
									{link.label}
								</Link>
							);
						})}
					</nav>

					<div className="flex items-center gap-0.5">
						<button
							type="button"
							aria-label="Set up MCP"
							aria-haspopup="dialog"
							onClick={() => setMcpOpen(true)}
							className="hidden min-h-11 cursor-pointer items-center px-1.5 sm:inline-flex"
						>
							<span className={cn(mcpPill, "h-[30px] px-3")}>MCP</span>
						</button>
						<a href="https://x.com/dcbuilder" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className={cn(iconLink, "hidden sm:inline-flex")}>
							<XIcon className="size-[18px]" />
						</a>
						<a href="https://github.com/dcbuild3r" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={cn(iconLink, "hidden sm:inline-flex")}>
							<GitHubIcon className="size-[18px]" />
						</a>
						<ThemeToggle />
						<button
							ref={menuButtonRef}
							type="button"
							onClick={openMenu}
							className={cn(squareButton, "inline-flex lg:hidden")}
							aria-label="Open menu"
							aria-haspopup="dialog"
							aria-expanded={isMenuOpen}
							aria-controls="mobile-menu"
						>
							<svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
								<path d="M4 7h16M4 12h16M4 17h16" />
							</svg>
						</button>
					</div>
				</div>
			</header>

			{/* Outside the header: its backdrop-filter would trap fixed positioning. */}
			{isMenuOpen && (
				<div
					id="mobile-menu"
					ref={menuRef}
					role="dialog"
					aria-modal="true"
					aria-label="Navigation menu"
					onKeyDown={handleMenuKeyDown}
					className="fixed inset-0 z-[var(--z-modal)] flex flex-col overflow-y-auto bg-ground px-6 pt-2.5 pb-7 lg:hidden"
				>
					<div className="flex min-h-[50px] items-center justify-between">
						<Logo onClick={closeMenu} />
						<button type="button" onClick={closeMenu} aria-label="Close menu" className={cn(squareButton, "inline-flex")}>
							<svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
								<path d="M6 6l12 12M18 6L6 18" />
							</svg>
						</button>
					</div>
					<nav aria-label="Menu" className="mt-3 flex flex-1 flex-col">
						{[{ href: "/", label: "Home" }, ...navLinks].map((link) => (
							<Link
								key={link.href}
								href={link.href}
								aria-current={(link.href === "/" ? pathname === "/" : isActive(pathname, link.href)) ? "page" : undefined}
								onClick={closeMenu}
								className="flex min-h-14 flex-1 items-center justify-center text-center text-[34px] font-bold tracking-[-0.035em] text-ink aria-[current=page]:text-accent"
							>
								{link.label}
							</Link>
						))}
					</nav>
					<div className="flex flex-wrap items-center justify-center gap-4 pt-3">
						<button
							type="button"
							aria-label="Set up MCP"
							aria-haspopup="dialog"
							onClick={() => {
								closeMenu();
								setMcpOpen(true);
							}}
							className={cn(mcpPill, "h-12 cursor-pointer rounded-[14px] px-[18px] text-[13px]")}
						>
							MCP
						</button>
						<a href="https://x.com/dcbuilder" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className={menuSocial}>
							<XIcon className="size-[17px]" />
						</a>
						<a href="https://github.com/dcbuild3r" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={menuSocial}>
							<GitHubIcon className="size-[19px]" />
						</a>
					</div>
				</div>
			)}

			<McpDialog open={mcpOpen} onClose={() => setMcpOpen(false)} />
		</>
	);
}
