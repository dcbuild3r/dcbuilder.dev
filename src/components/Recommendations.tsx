"use client";

import { useState } from "react";

const RECOMMENDED_LINKS = [
  { name: "TBPN", url: "https://tbpn.substack.com", description: "Technology Business Programming Network — daily live business & tech podcast by @johncoogan & @jordihays" },
  { name: "SemiAnalysis", url: "https://semianalysis.com", description: "Deep dives on semiconductors, AI infrastructure, and compute" },
  { name: "Ethereal News", url: "https://etherealnews.substack.com", description: "Ethereum ecosystem news and analysis" },
  { name: "ZK Mesh", url: "https://zkmesh.substack.com", description: "Monthly zero-knowledge newsletter (zkmesh+ for premium)" },
  { name: "dcbuilder.dev/blog", url: "/blog", description: "Long-form thoughts and writeups" },
  { name: "@dcbuilder on X", url: "https://x.com/dcbuilder", description: "More curated content on X" },
] as const;

const OTHER_CONTENT = [
  { name: "Zero Knowledge FM", url: "https://zeroknowledge.fm", description: "Podcast on ZK proofs and the decentralized web" },
  { name: "TBPN Podcast", url: "https://tbpn.substack.com", description: "Daily live video & audio show on business and tech by @johncoogan & @jordihays" },
  { name: "Hardcore History", url: "https://www.dancarlin.com/hardcore-history-series", description: "Dan Carlin's epic deep-dives into history" },
] as const;

function ExternalIcon() {
  return (
    <svg className="inline-block w-3.5 h-3.5 ml-1 opacity-40 group-hover:opacity-70 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function LinkItem({ item }: { item: { name: string; url: string; description: string } }) {
  const isExternal = item.url.startsWith("http");
  return (
    <a
      href={item.url}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group flex items-start gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700/60 p-3 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 underline underline-offset-2 decoration-neutral-300 dark:decoration-neutral-600 group-hover:decoration-neutral-500 dark:group-hover:decoration-neutral-400 transition-colors">
          {item.name}
        </span>
        {isExternal && <ExternalIcon />}
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{item.description}</p>
      </div>
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  );
}

export function Recommendations() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 bg-neutral-50 dark:bg-neutral-900/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recommendations</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Newsletters, podcasts, and other content I follow and enjoy.
          </p>
        </div>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="recommendations-panel"
          onClick={() => setIsOpen((v) => !v)}
          className="group inline-flex items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-5 py-2.5 text-sm font-semibold tracking-wide text-neutral-900 dark:text-neutral-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {isOpen && (
        <div id="recommendations-panel" className="mt-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
              Recommended newsletters &amp; links
            </h3>
            <div className="space-y-2">
              {RECOMMENDED_LINKS.map((item) => (
                <LinkItem key={item.name} item={item} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
              Other content I like
            </h3>
            <div className="space-y-2">
              {OTHER_CONTENT.map((item) => (
                <LinkItem key={item.name} item={item} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
