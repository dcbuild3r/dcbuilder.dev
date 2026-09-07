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

export function ArticleAIContext({ title }: { title: string }) {
	const [isOpen, setIsOpen] = useState(false);
	const [copyState, setCopyState] = useState<"idle" | "copying" | "copied" | "error">("idle");
	const [handoff, setHandoff] = useState<HandoffState | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const closeMenu = useCallback(() => setIsOpen(false), []);

	useEffect(() => {
		if (!isOpen) return;
		const handlePointerDown = (event: MouseEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) closeMenu();
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
		<div ref={containerRef} className="relative flex justify-end">
			<button
				ref={triggerRef}
				type="button"
				onClick={() => setIsOpen((open) => !open)}
				aria-haspopup="dialog"
				aria-expanded={isOpen}
				className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800 shadow-sm transition-[background-color,transform] hover:bg-neutral-50 active:translate-y-px dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
			>
				<ChatCircleDots size={18} aria-hidden="true" />
				Use with AI
				<CaretDown size={14} weight="bold" aria-hidden="true" className={isOpen ? "rotate-180" : ""} />
			</button>

			{isOpen && (
				<div
					role="dialog"
					aria-label="Use this article with AI"
					className="absolute right-0 top-full z-[var(--z-dropdown)] mt-2 w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl shadow-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-black/30"
				>
					<button
						type="button"
						onClick={copyArticle}
						disabled={copyState === "copying"}
						className="flex w-full items-start gap-3 bg-neutral-50 px-5 py-4 text-left transition-[background-color,transform] hover:bg-neutral-100 active:translate-y-px disabled:cursor-wait disabled:opacity-70 dark:bg-neutral-800/70 dark:hover:bg-neutral-800"
					>
						<span className="mt-0.5 text-black dark:text-white" aria-hidden="true">
							{copyState === "copied" ? <Check size={22} weight="bold" /> : <CopySimple size={22} />}
						</span>
						<span aria-live="polite">
							<span className="block font-semibold text-neutral-900 dark:text-neutral-100">
								{copyState === "copied"
									? "Copied as Markdown"
									: copyState === "copying"
										? "Copying..."
										: copyState === "error"
											? "Copy failed"
											: "Copy article"}
							</span>
							<span className="mt-0.5 block text-sm text-neutral-600 dark:text-neutral-400">
								{copyState === "error"
									? "Could not copy this article. Try again."
									: "Copy the full article as Markdown."}
							</span>
						</span>
					</button>

					<div className="border-t border-neutral-200 px-5 py-4 dark:border-neutral-700">
						<div className="flex items-start gap-3">
							<ChatCircleDots
								size={22}
								className="mt-0.5 shrink-0 text-black dark:text-white"
								aria-hidden="true"
							/>
							<div>
								<p className="font-semibold text-neutral-900 dark:text-neutral-100">Ask with context</p>
								<p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
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
									className={`flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 transition-[background-color,transform] hover:bg-neutral-50 active:translate-y-px dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800 ${provider.id === "notebooklm" ? "col-span-2" : ""}`}
								>
									{provider.label}
								</button>
							))}
						</div>
						{handoff && (
							<div
								className="mt-3 rounded-lg bg-neutral-100 p-3 text-xs leading-5 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
								aria-live="polite"
							>
								{handoff.status === "copying" && <p>Preparing article context...</p>}
								{handoff.status === "error" && (
									<>
										<p>Could not copy the article context. Try again.</p>
										<button
											type="button"
											onClick={() => prepareGoogleHandoff(handoff.provider)}
											className="mt-2 font-semibold text-neutral-950 underline underline-offset-2 dark:text-white"
										>
											Try again
										</button>
									</>
								)}
								{handoff.status === "ready" && (
									<>
										<p>
											{handoff.provider === "gemini"
												? "Full article and prompt copied. Gemini does not support prefilled links—open it, then paste."
												: "Article link copied. NotebookLM does not support prefilled sources—open it, choose Add source → Website, then paste."}
										</p>
										<div className="mt-2 flex gap-3">
											<button
												type="button"
												onClick={() => openProviderDestination(handoff.provider)}
												className="font-semibold text-neutral-950 underline underline-offset-2 dark:text-white"
											>
												Open {handoff.provider === "gemini" ? "Gemini" : "NotebookLM"}
											</button>
											<button
												type="button"
												onClick={() => prepareGoogleHandoff(handoff.provider)}
												className="font-semibold text-neutral-950 underline underline-offset-2 dark:text-white"
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
