"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MCP_URL = "https://mcp.dcbuilder.dev/mcp";
const SETUP_PROMPT = `Add the public dcbuilder.dev MCP server at ${MCP_URL}. It needs no authentication and offers read-only tools for Home, About, News, Blog, Candidates, Portfolio, and Jobs. Use its search tools and cite the canonical URLs in results. Do not send credentials to this server.`;

function CopyCell({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { setCopied(false); }
  }
  return <div className="space-y-2">
    <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">{label}</span><button type="button" onClick={copy} className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:hover:bg-blue-950" aria-label={`Copy ${label.toLowerCase()}`}>{copied ? "Copied" : "Copy"}</button></div>
    <div className="overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-sm leading-relaxed break-words text-neutral-800 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200">{value}</div>
  </div>;
}

export function McpSetup() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const triggerButton = trigger.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const dialog = document.getElementById("mcp-setup-dialog");
      const focusable = Array.from(dialog?.querySelectorAll<HTMLElement>("button, a[href]") ?? []);
      if (!focusable.length) return;
      if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", onKeyDown); triggerButton?.focus(); };
  }, [open]);
  return <>
    <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-label="Set up MCP" aria-haspopup="dialog" className="rounded-lg p-2 font-mono text-xs font-bold hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-800">MCP</button>
    {open && createPortal(<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section id="mcp-setup-dialog" role="dialog" aria-modal="true" aria-labelledby="mcp-setup-title" className="max-h-[min(90dvh,48rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl sm:p-8 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="mb-6 flex items-start justify-between gap-4"><div><h2 id="mcp-setup-title" className="text-2xl font-semibold tracking-tight">Connect your AI</h2><p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">Search the public website from an AI client. No account or API key is needed. This connection is read only.</p></div><button ref={close} type="button" onClick={() => setOpen(false)} aria-label="Close MCP setup" className="rounded-lg p-2 text-xl leading-none hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-800">×</button></div>
        <div className="space-y-6"><CopyCell label="MCP URL" value={MCP_URL} /><CopyCell label="Prompt for your AI" value={SETUP_PROMPT} /></div>
      </section>
    </div>, document.body)}
  </>;
}
