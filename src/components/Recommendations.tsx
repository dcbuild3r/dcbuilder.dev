"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { getRecommendedLinks, OTHER_CONTENT_I_LIKE } from "@/lib/recommendations";

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
      className="group flex items-start gap-3 rounded-2xl border border-line p-3 transition-colors hover:border-line-strong hover:bg-surface-2/60"
    >
      <div className="min-w-0 flex-1">
        <span className="text-sm font-semibold text-ink underline decoration-line-strong underline-offset-2 transition-colors group-hover:decoration-muted">
          {item.name}
        </span>
        {isExternal && <ExternalIcon />}
        <p className="mt-0.5 text-sm text-muted">{item.description}</p>
      </div>
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-line-strong transition-colors group-hover:text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  );
}

export function Recommendations() {
  const [isOpen, setIsOpen] = useState(false);
  const recommendedLinks = getRecommendedLinks();

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">Recommendations</h2>
          <p className="mt-2 text-sm text-body">
            Newsletters, podcasts, and other content I follow and enjoy.
          </p>
        </div>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="recommendations-panel"
          onClick={() => setIsOpen((v) => !v)}
          className={buttonClass({ variant: "secondary" })}
        >
          {isOpen ? "Hide" : "Show"}
        </button>
      </div>

      {isOpen && (
        <div id="recommendations-panel" className="mt-6 space-y-6">
          <div>
            <h3 className="mb-2 font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-muted">
              Recommended newsletters &amp; links
            </h3>
            <div className="space-y-2">
              {recommendedLinks.map((item) => (
                <LinkItem key={item.name} item={item} />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-muted">
              Other content I like
            </h3>
            <div className="space-y-2">
              {OTHER_CONTENT_I_LIKE.map((item) => (
                <LinkItem key={item.name} item={item} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
