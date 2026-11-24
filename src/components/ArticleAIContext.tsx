"use client";

import { CaretDown, ChatCircleDots, Check, CopySimple } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	buildAIClipboardPrompt,
	buildAIProviderUrl,
	buildArticleMarkdownUrl,
	type AIProvider,
} from "@/lib/article-ai-context";

const providers: Array<{ id: AIProvider; label: string }> = [
	{ id: "chatgpt", label: "ChatGPT" },
	{ id: "claude", label: "Claude" },
	{ id: "gemini", label: "Gemini" },
	{ id: "grok", label: "Grok" },
	{ id: "notebooklm", label: "NotebookLM" },
];

type GoogleProvider = "gemini" | "notebooklm";
type HandoffState = {
	provider: GoogleProvider;
	status: "copying" | "ready" | "error";
};

interface ArticleAIContextProps {
	title: string;
}

export function ArticleAIContext({ title }: ArticleAIContextProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "error">("idle");
	const [handoff, setHandoff] = useState<HandoffState | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);

	const closeMenu = useCallback(() => setIsOpen(false), []);

	useEffect(() => {
		if (!isOpen) return;

		const handlePointerDown = (event: MouseEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) {
				closeMenu();
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				closeMenu();
				triggerRef.current?.focus();
			}
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [closeMenu, isOpen]);

	const pageUrl = () => `${window.location.origin}${window.location.pathname}`;

	const copyArticle = async () => {
		try {
			setCopyState("copying");
			const response = await fetch(buildArticleMarkdownUrl(pageUrl()), {
				headers: { Accept: "text/markdown" },
			});
			if (!response.ok) throw new Error("Markdown request failed");

			await navigator.clipboard.writeText(await response.text());
			setCopyState("copied");
			window.setTimeout(() => setCopyState("idle"), 2000);
		} catch {
			setCopyState("error");
		}
	};

	const isMobileDevice = () => window.matchMedia("(pointer: coarse)").matches;
	const openProviderDestination = (provider: AIProvider) => {
		const destination = buildAIProviderUrl(provider, pageUrl(), title);
		if (isMobileDevice()) {
			window.location.assign(destination);
			return;
		}
		window.open(destination, "_blank", "noopener,noreferrer");
	};
	const prepareGoogleHandoff = async (provider: GoogleProvider) => {
		setHandoff({ provider, status: "copying" });
		try {
			let clipboardText = pageUrl();
			if (provider === "gemini") {
				const response = await fetch(buildArticleMarkdownUrl(pageUrl()), {
					headers: { Accept: "text/markdown" },
				});
				if (!response.ok) throw new Error("Markdown request failed");
				clipboardText = buildAIClipboardPrompt(pageUrl(), title, await response.text());
			}
			await navigator.clipboard.writeText(clipboardText);
			setHandoff({ provider, status: "ready" });
		} catch {
			setHandoff({ provider, status: "error" });
		}
	};
	const openProvider = async (provider: AIProvider) => {
		if (provider !== "gemini" && provider !== "notebooklm") {
			openProviderDestination(provider);
			closeMenu();
			return;
		}

		await prepareGoogleHandoff(provider);
	};

	return (
		<div ref={containerRef} className="relative">
			<button
				ref={triggerRef}
				type="button"
				onClick={() => setIsOpen((open) => !open)}
				aria-haspopup="dialog"
				aria-expanded={isOpen}
				className="inline-flex items-center gap-2 min-h-11 rounded-full border border-violet-300 bg-violet-50 px-4 text-sm font-semibold text-violet-800 shadow-[0_4px_14px_rgba(124,58,237,0.16)] transition-colors hover:bg-violet-100 dark:border-violet-400/40 dark:bg-violet-500/15 dark:text-violet-200 dark:hover:bg-violet-500/25"
			>
				<ChatCircleDots size={18} weight="regular" aria-hidden="true" />
				Use with AI
				<CaretDown
					size={14}
					weight="bold"
					aria-hidden="true"
					className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{isOpen && (
				<div
					role="dialog"
					aria-label="Use this article with AI"
					className="absolute right-0 top-full z-[var(--z-dropdown)] mt-2 w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-surface"
				>
					<button
						type="button"
						onClick={copyArticle}
						disabled={copyState === "copying"}
						className="flex w-full items-start gap-3 bg-surface-2 px-5 py-4 text-left transition-colors hover:bg-line disabled:cursor-wait disabled:opacity-70"
					>
						<span className="mt-0.5 text-red-500" aria-hidden="true">
							{copyState === "copied" ? (
								<Check size={22} weight="bold" />
							) : (
								<CopySimple size={22} weight="regular" />
							)}
						</span>
						<span aria-live="polite">
							<span className="block font-semibold text-ink">
								{copyState === "copied"
									? "Copied as Markdown"
									: copyState === "copying"
										? "Copying..."
										: copyState === "error"
											? "Copy failed"
											: "Copy article"}
							</span>
							<span className="mt-0.5 block text-sm text-muted">
								{copyState === "error"
									? "Could not copy this article. Try again."
									: "Copy the full article as Markdown."}
							</span>
						</span>
					</button>

					<div className="border-t border-line px-5 py-4">
						<div className="flex items-start gap-3">
							<ChatCircleDots
								size={22}
								weight="regular"
								className="mt-0.5 shrink-0 text-red-500"
								aria-hidden="true"
							/>
							<div>
								<p className="font-semibold text-ink">
									Ask with context
								</p>
								<p className="mt-0.5 text-sm text-muted">
									Open this article in an AI assistant.
								</p>
							</div>
						</div>

						<div className="mt-4 grid grid-cols-2 gap-2">
							{providers.map((provider) => (
								<button
									key={provider.id}
									type="button"
									onClick={() => openProvider(provider.id)}
									className={`flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2 ${provider.id === "notebooklm" ? "col-span-2" : ""}`}
								>
									{provider.label}
								</button>
							))}
						</div>
						{handoff && (
							<div
								className="mt-3 rounded-lg bg-surface-2 p-3 text-xs leading-5 text-body"
								aria-live="polite"
							>
								{handoff.status === "copying" && <p>Preparing article context...</p>}
								{handoff.status === "error" && (
									<>
										<p>Could not copy the article context. Try again.</p>
										<button
											type="button"
											onClick={() => prepareGoogleHandoff(handoff.provider)}
											className="mt-2 font-semibold text-ink underline underline-offset-2"
										>
											Try again
										</button>
									</>
								)}
								{handoff.status === "ready" && (
									<>
										<p>
											{handoff.provider === "gemini"
												? "Full article and prompt copied. Open Gemini and paste."
												: "Article link copied. Open NotebookLM, choose Add source → Website, then paste."}
										</p>
										<div className="mt-2 flex gap-3">
											<button
												type="button"
												onClick={() => openProviderDestination(handoff.provider)}
												className="font-semibold text-ink underline underline-offset-2"
											>
												Open {handoff.provider === "gemini" ? "Gemini" : "NotebookLM"}
											</button>
											<button
												type="button"
												onClick={() => prepareGoogleHandoff(handoff.provider)}
												className="font-semibold text-ink underline underline-offset-2"
											>
												Copy again
											</button>
										</div>
									</>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
