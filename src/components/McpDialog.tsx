"use client";

import { useState } from "react";
import { ModalShell, useModalClose } from "./ui/ModalShell";
import { Button } from "./ui/Button";
import { MCP_URL } from "@/lib/site";

const SETUP_PROMPT = `Add the public dcbuilder.dev MCP server at ${MCP_URL}. It needs no authentication and offers read-only tools for Home, About, News, Blog, Candidates, Portfolio, and Jobs. Use its search tools and cite the canonical URLs in results. Do not send credentials to this server.`;

function CopyField({ label, value }: { label: string; value: string }) {
	const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

	async function copy() {
		try {
			await navigator.clipboard.writeText(value);
			setStatus("copied");
			window.setTimeout(() => setStatus("idle"), 2000);
		} catch {
			setStatus("error");
		}
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-3">
				<span className="text-sm font-medium text-ink">{label}</span>
				<Button variant="secondary" onClick={copy} aria-label={`Copy ${label}`}>
					{status === "copied" ? "Copied" : "Copy"}
				</Button>
			</div>
			<code className="block break-words rounded-xl bg-surface-2 px-4 py-3 font-mono text-[13px] leading-relaxed text-ink">
				{value}
			</code>
			{status === "error" && <p role="status" className="text-sm text-muted">Copy failed. Try again.</p>}
		</div>
	);
}

function Body() {
	const close = useModalClose();

	return (
		<div className="flex flex-col gap-5 p-7">
			<div>
				<h2 id="mcp-dialog-title" className="text-2xl font-semibold tracking-[-0.03em] text-ink">
					Connect your AI
				</h2>
				<p className="mt-2 text-[15px] leading-relaxed text-body">
					Search the public site from an MCP client. This connection is read only and needs no account or API key.
				</p>
			</div>
			<CopyField label="MCP URL" value={MCP_URL} />
			<CopyField label="Prompt for your AI" value={SETUP_PROMPT} />
			<Button variant="secondary" onClick={close} className="self-start">
				Close
			</Button>
		</div>
	);
}

export function McpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
	return (
		<ModalShell open={open} onClose={onClose} labelledBy="mcp-dialog-title" className="sm:max-w-md">
			<Body />
		</ModalShell>
	);
}
