"use client";

import Link from "next/link";
import { FormEvent, useId, useState } from "react";
import {
  OTHER_CONTENT_I_LIKE,
  getRecommendedLinks,
} from "@/lib/recommendations";
import { getNewsToolsRecommendationSummary } from "@/lib/news-tools";
import { cn } from "@/lib/utils";

type NewsToolsTab = "archive" | "subscribe" | "recommendations";

type ArchiveCampaignPreview = {
  id: string;
  publicSlug: string;
  subject: string;
  previewText: string | null;
  newsletterType: string;
  sentAt: string | null;
};

type NewsToolsClientProps = {
  campaigns: ArchiveCampaignPreview[];
  archiveAvailable?: boolean;
};

const TAB_LABELS: Record<NewsToolsTab, { title: string; blurb: string }> = {
  archive: {
    title: "Latest issue",
    blurb: "Jump into recent newsletters without leaving the page.",
  },
  subscribe: {
    title: "Subscribe",
    blurb: "Choose what lands in your inbox and keep it lightweight.",
  },
  recommendations: {
    title: "Recommendations",
    blurb: "A tighter shortlist of links, newsletters, and media worth following.",
  },
};

const NEWSLETTER_OPTIONS = [
  { value: "news", label: "News digest" },
  { value: "jobs", label: "Jobs updates" },
  { value: "candidates", label: "Candidate updates" },
] as const;

const TYPE_LABELS: Record<string, string> = {
  news: "News",
  jobs: "Jobs",
  candidates: "Candidates",
};

const TYPE_ACCENTS: Record<string, string> = {
  news: "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-200 dark:ring-blue-400/20",
  jobs: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20",
  candidates: "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20",
};

function formatShortDate(value: string | null) {
  if (!value) return null;

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function ArchivePanel({
  campaigns,
  archiveAvailable,
}: {
  campaigns: ArchiveCampaignPreview[];
  archiveAvailable: boolean;
}) {
  if (!archiveAvailable) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-amber-300/80 bg-amber-50/80 px-4 py-5 text-sm text-amber-900 dark:border-amber-900/80 dark:bg-amber-950/40 dark:text-amber-100">
        Newsletter archive is temporarily unavailable. The rest of the news page
        still works, but newsletter history is offline until the newsletter
        database is available again.
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-neutral-300/80 bg-white/70 px-4 py-5 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-950/60 dark:text-neutral-400">
        No newsletter issues yet.
      </div>
    );
  }

  const [lead, ...rest] = campaigns;

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.95fr)]">
      <Link
        href={`/newsletters/${lead.publicSlug}`}
        className="group rounded-[1.5rem] border border-neutral-900 bg-neutral-950 px-4 py-4 text-white transition-transform duration-200 hover:-translate-y-0.5 dark:border-neutral-200 dark:bg-white dark:text-neutral-950"
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60 dark:text-neutral-500">
          <span>Lead issue</span>
          {lead.sentAt && <span>{formatShortDate(lead.sentAt)}</span>}
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-tight">{lead.subject}</h3>
        {lead.previewText && (
          <p className="mt-2 line-clamp-2 text-sm text-white/72 dark:text-neutral-600">
            {lead.previewText}
          </p>
        )}
        <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
          Read issue
          <span aria-hidden="true">/</span>
        </div>
      </Link>

      <div className="flex flex-col gap-2">
        {rest.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/newsletters/${campaign.publicSlug}`}
            className="group rounded-[1.25rem] border border-neutral-200 bg-white/80 px-3.5 py-3 transition-colors hover:border-neutral-300 hover:bg-white dark:border-neutral-800 dark:bg-neutral-950/60 dark:hover:border-neutral-700 dark:hover:bg-neutral-950"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {campaign.subject}
                </p>
                {campaign.previewText && (
                  <p className="mt-1 line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {campaign.previewText}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-2 py-1 text-[10px] font-semibold ring-1",
                  TYPE_ACCENTS[campaign.newsletterType] ?? TYPE_ACCENTS.news,
                )}
              >
                {TYPE_LABELS[campaign.newsletterType] ?? campaign.newsletterType}
              </span>
            </div>
          </Link>
        ))}

        <Link
          href="/newsletters"
          className="inline-flex items-center justify-between rounded-[1.25rem] border border-dashed border-neutral-300 px-3.5 py-3 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-white"
        >
          Browse full archive
          <span aria-hidden="true">/</span>
        </Link>
      </div>
    </div>
  );
}

function SubscribePanel() {
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string[]>(["news"]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const toggleOption = (value: string) => {
    setSelected((current) => (
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    ));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/v1/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          newsletterTypes: selected,
          source: "news-page-compact-tools",
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error || "Unable to subscribe");
        return;
      }

      setStatus("success");
      setMessage("Check your inbox to confirm.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Unable to subscribe right now. Try again later.");
    }
  };

  return (
    <form className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)]" onSubmit={onSubmit}>
      <div>
        <p className="max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          Choose the streams you care about and keep the full archive off to the side until you need it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {NEWSLETTER_OPTIONS.map((option) => {
            const active = selected.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleOption(option.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-200/70 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[1.25rem] border border-neutral-200 bg-white/80 p-3 dark:border-neutral-800 dark:bg-neutral-950/60">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">
            Email
          </span>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:focus:border-neutral-500"
            />
            <button
              type="submit"
              disabled={status === "submitting" || selected.length === 0}
              className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {status === "submitting" ? "Joining..." : "Join"}
            </button>
          </div>
        </label>

        {message && (
          <p
            className={cn(
              "mt-2 text-sm",
              status === "error"
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-700 dark:text-emerald-400",
            )}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}

function RecommendationsPanel() {
  const [showFullList, setShowFullList] = useState(false);
  const recommendationSummary = getNewsToolsRecommendationSummary();
  const remainingRecommendations = getRecommendedLinks().filter(
    (link) => !recommendationSummary.highlights.some((highlight) => highlight.name === link.name),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(15rem,0.8fr)]">
      <div>
        <div className="grid gap-2 sm:grid-cols-2">
          {recommendationSummary.highlights.map((item) => (
            <a
              key={item.name}
              href={item.url}
              target={item.url.startsWith("http") ? "_blank" : undefined}
              rel={item.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group rounded-[1.25rem] border border-neutral-200 bg-white/80 px-3.5 py-3 transition-colors hover:border-neutral-300 hover:bg-white dark:border-neutral-800 dark:bg-neutral-950/60 dark:hover:border-neutral-700 dark:hover:bg-neutral-950"
            >
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {item.name}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                {item.description}
              </p>
            </a>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFullList((current) => !current)}
            className="inline-flex items-center rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-white"
          >
            {showFullList ? "Hide full list" : `Show ${recommendationSummary.hiddenCount} more`}
          </button>
          <span className="text-xs uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
            Compact by default
          </span>
        </div>

        {showFullList && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {remainingRecommendations.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target={item.url.startsWith("http") ? "_blank" : undefined}
                rel={item.url.startsWith("http") ? "noopener noreferrer" : undefined}
                className="rounded-[1rem] border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950/70 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:text-white"
              >
                {item.name}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[1.5rem] border border-neutral-900 bg-neutral-950 px-4 py-4 text-white dark:border-neutral-700 dark:bg-neutral-900">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          Other content I like
        </p>
        <div className="mt-3 space-y-2">
          {OTHER_CONTENT_I_LIKE.map((item) => (
            <a
              key={item.name}
              href={item.url}
              target={item.url.startsWith("http") ? "_blank" : undefined}
              rel={item.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="block rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2.5 transition-colors hover:bg-white/10"
            >
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="mt-1 text-xs leading-5 text-white/65">{item.description}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NewsToolsClient({
  campaigns,
  archiveAvailable = true,
}: NewsToolsClientProps) {
  const [activeTab, setActiveTab] = useState<NewsToolsTab>("archive");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const panelId = useId();
  const recommendationSummary = getNewsToolsRecommendationSummary();

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-[linear-gradient(180deg,rgba(250,250,250,0.96),rgba(245,245,245,0.88))] px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-[linear-gradient(180deg,rgba(18,18,18,0.96),rgba(10,10,10,0.9))] sm:px-5">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-neutral-300/70 to-transparent dark:via-neutral-700/70" />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-neutral-400 dark:text-neutral-500">
            News tools
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Stay close to the signal
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            One compact deck for archive access, subscription controls, and a tighter recommendation list.
          </p>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <span className="rounded-full bg-neutral-200/80 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {campaigns.length} issues
          </span>
          <button
            type="button"
            aria-expanded={isMobileOpen}
            aria-controls={panelId}
            onClick={() => setIsMobileOpen((current) => !current)}
            className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
          >
            {isMobileOpen ? "Close tools" : "Open tools"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
        <span>{campaigns.length} recent issues</span>
        <span className="h-1 w-1 rounded-full bg-current/40" />
        <span>{recommendationSummary.highlights.length} highlighted picks</span>
      </div>

      <div
        id={panelId}
        className={cn("mt-4 md:mt-5", isMobileOpen ? "block" : "hidden md:block")}
      >
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TAB_LABELS) as NewsToolsTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "bg-neutral-200/70 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700",
              )}
            >
              {TAB_LABELS[tab].title}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-[1.6rem] border border-neutral-200/80 bg-white/80 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950/70 sm:px-5">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-neutral-950 dark:text-white">
                {TAB_LABELS[activeTab].title}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {TAB_LABELS[activeTab].blurb}
              </p>
            </div>
          </div>

          {activeTab === "archive" && (
            <ArchivePanel
              campaigns={campaigns}
              archiveAvailable={archiveAvailable}
            />
          )}
          {activeTab === "subscribe" && <SubscribePanel />}
          {activeTab === "recommendations" && <RecommendationsPanel />}
        </div>
      </div>
    </section>
  );
}
