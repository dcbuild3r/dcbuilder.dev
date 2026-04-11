"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ErrorAlert } from "@/components/admin/ActionButtons";
import { adminFetch, getAdminApiKey } from "@/lib/admin-utils";
import {
  buildNewsletterTypes,
  isPreferenceRowDirty,
  toPreferenceFlags,
  toSubscriberDraftRow,
  type NewsletterSubscriberApiRow,
  type NewsletterSubscriberPreference,
  type NewsletterSubscriberRowDraft,
} from "@/lib/newsletter-subscribers";
import {
  canAutoRenderComposePreview,
  getSuggestedNewsletterSubject,
  getNewsletterStarterHeadingClassName,
  NEWSLETTER_STARTER_RENDERED_PANEL_CLASSNAME,
  nextAvailabilityErrorAfterSubscribersRefresh,
  resolveNewsletterSummaryControls,
  shouldLoadSubscribersOnModeChange,
  type NewsletterSummaryTimeframePreset,
} from "@/lib/newsletter-studio";

type NewsletterType = "news" | "jobs" | "candidates";
type NewsletterContentMode = "template" | "markdown" | "manual";
type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";
type WorkspaceView = "editor" | "split" | "preview";
type AvailabilityMeta = {
  newsletterUnavailable?: boolean;
  reason?: string;
};

type Mode = "compose" | "queue" | "subscribers" | "templates";
type PreviewTab = "subject" | "html" | "text" | "starter";
type TemplateFieldKey = "subjectTemplate" | "htmlTemplate" | "textTemplate" | "markdownTemplate";
type ComposeFieldKey = "markdownContent" | "manualHtml" | "manualText";

type DigestItem = {
  title: string;
  subtitle?: string;
  url?: string;
  currentViews?: number;
  delta?: number;
};

type PreviewContext = {
  digest: {
    heading: string;
    summary: string;
    periodDays: number;
    totalViews?: number;
    deltaViews?: number;
    items: DigestItem[];
  };
  recentNews: Array<{
    title: string;
    url: string;
    date: string;
    type: string;
    source: string;
  }>;
};

type RenderedPayload = {
  subject: string;
  html: string;
  text: string;
};

type CampaignPreviewResult = {
  rendered: RenderedPayload;
  starter: { markdown: string };
  placeholders: string[];
  context: PreviewContext;
};

type TemplatePreviewResult = CampaignPreviewResult & {
  template: NewsletterTemplate;
};

interface NewsletterCampaign {
  id: string;
  newsletterType: NewsletterType;
  subject: string;
  previewText: string | null;
  contentMode: NewsletterContentMode;
  markdownContent: string | null;
  manualHtml: string | null;
  manualText: string | null;
  timeframePreset?: NewsletterSummaryTimeframePreset | null;
  periodDays: number;
  minimumRelevance?: number | null;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  failureReason: string | null;
  createdBy: string | null;
  createdAt: string;
  archiveSubject?: string | null;
  archivePreviewText?: string | null;
  archiveContentMode?: NewsletterContentMode | null;
  archiveMarkdownContent?: string | null;
  archiveManualHtml?: string | null;
  archiveManualText?: string | null;
  archiveRenderedHtml?: string | null;
  archiveCorrectedAt?: string | null;
  archiveCorrectedBy?: string | null;
}

interface NewsletterTemplate {
  newsletterType: NewsletterType;
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string;
  markdownTemplate: string;
}

interface SubscriberUpdateResult {
  subscriber: {
    id: string;
    email: string;
    status: string;
  };
  preferences: NewsletterSubscriberPreference[];
}

type CampaignDraft = {
  newsletterType: NewsletterType;
  subject: string;
  previewText: string;
  contentMode: NewsletterContentMode;
  markdownContent: string;
  manualHtml: string;
  manualText: string;
  timeframePreset: NewsletterSummaryTimeframePreset;
  periodDays: number;
  minimumRelevance: number;
  scheduledAtLocal: string;
};

type CampaignEditMode = "campaign" | "archive";

const NEWSLETTER_TYPES: NewsletterType[] = ["news", "jobs", "candidates"];
const MUTABLE_STATUSES = new Set<CampaignStatus>(["draft", "scheduled"]);
type MarkdownFormatKind = "h2" | "bold" | "italic" | "link" | "list" | "quote" | "code" | "divider";

const MARKDOWN_TOOLBAR_ACTIONS: Array<{ id: MarkdownFormatKind; label: string }> = [
  { id: "h2", label: "H2" },
  { id: "bold", label: "Bold" },
  { id: "italic", label: "Italic" },
  { id: "link", label: "Link" },
  { id: "list", label: "List" },
  { id: "quote", label: "Quote" },
  { id: "code", label: "Code" },
  { id: "divider", label: "Divider" },
];

const SUBSTACK_SANS_FONT_STACK = "'SF Pro Display', -apple-system, system-ui, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'";

const FALLBACK_PLACEHOLDERS = [
  "campaign_subject",
  "campaign_type",
  "period_days",
  "digest_heading",
  "digest_summary",
  "total_views",
  "delta_views",
  "digest_items_text",
  "digest_items_markdown",
  "recent_news_text",
  "recent_news_markdown",
  "unsubscribe_url",
  "preferences_url",
  "default_text_body",
  "default_markdown_body",
  "generated_at_iso",
] as const;

const PLACEHOLDER_ORDER = [
  "campaign_subject",
  "digest_heading",
  "digest_summary",
  "digest_items_markdown",
  "recent_news_markdown",
  "total_views",
  "delta_views",
  "campaign_type",
  "period_days",
  "digest_items_text",
  "recent_news_text",
  "default_markdown_body",
  "default_text_body",
  "preferences_url",
  "unsubscribe_url",
  "generated_at_iso",
] as const;

const MINIMAL_WRITING_PLACEHOLDERS = new Set([
  "campaign_subject",
  "campaign_type",
  "period_days",
  "digest_heading",
  "digest_summary",
  "total_views",
  "delta_views",
  "preferences_url",
  "unsubscribe_url",
  "generated_at_iso",
]);

const MARKDOWN_WRITING_PLACEHOLDERS = new Set([
  ...MINIMAL_WRITING_PLACEHOLDERS,
  "digest_items_markdown",
  "recent_news_markdown",
  "default_markdown_body",
]);

const TEXT_WRITING_PLACEHOLDERS = new Set([
  ...MINIMAL_WRITING_PLACEHOLDERS,
  "digest_items_text",
  "recent_news_text",
  "default_text_body",
]);

const SUBJECT_WRITING_PLACEHOLDERS = new Set([
  "campaign_subject",
  "campaign_type",
  "period_days",
  "digest_heading",
  "generated_at_iso",
]);

function isHtmlPlaceholderToken(placeholder: string) {
  return placeholder.endsWith("_html") || placeholder === "default_html_body";
}

function orderPlaceholders(placeholders: string[]): string[] {
  const indexByName = new Map<string, number>(PLACEHOLDER_ORDER.map((name, index) => [name, index]));
  return [...new Set(placeholders)].sort((a, b) => {
    const aIdx = indexByName.get(a);
    const bIdx = indexByName.get(b);
    if (aIdx === undefined && bIdx === undefined) return a.localeCompare(b);
    if (aIdx === undefined) return 1;
    if (bIdx === undefined) return -1;
    return aIdx - bIdx;
  });
}

function filterRelevantPlaceholders(placeholders: string[], allowed: ReadonlySet<string>) {
  const filtered = placeholders.filter((placeholder) => allowed.has(placeholder));
  return filtered.length > 0 ? filtered : placeholders;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function serializeCampaignDraft(draft: CampaignDraft | null) {
  if (!draft) return null;
  return JSON.stringify(draft);
}

function applySummaryPreset<T extends { timeframePreset: NewsletterSummaryTimeframePreset; periodDays: number; minimumRelevance: number }>(
  current: T,
  timeframePreset: NewsletterSummaryTimeframePreset
) {
  const resolved = resolveNewsletterSummaryControls({
    timeframePreset,
    periodDays: current.periodDays,
    minimumRelevance: current.minimumRelevance,
  });

  return {
    ...current,
    ...resolved,
  };
}

function formatStatus(status: CampaignStatus) {
  return status === "sending" ? "Sending" : status.charAt(0).toUpperCase() + status.slice(1);
}

function formatLocalInputFromIso(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function getAvailabilityReason(meta: Record<string, unknown> | null): string | null {
  const candidate = meta as AvailabilityMeta | null;
  if (!candidate?.newsletterUnavailable) return null;
  return typeof candidate.reason === "string" && candidate.reason.trim()
    ? candidate.reason
    : "Newsletter database is temporarily unavailable.";
}

function StatusPill({ status }: { status: CampaignStatus }) {
  const styles = {
    draft: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
    scheduled:
      "border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/15 dark:text-indigo-200",
    sending:
      "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-200",
    sent: "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-200",
    failed: "border border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/15 dark:text-red-200",
  }[status];

  return (
    <span className={cx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", styles)}>
      {formatStatus(status)}
    </span>
  );
}

function SubscriberStatusPill({ status }: { status: string }) {
  const styles = {
    active:
      "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-200",
    pending:
      "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-200",
    unsubscribed:
      "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
  }[status] || "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200";

  return (
    <span className={cx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize", styles)}>
      {status}
    </span>
  );
}

function SubscriberPreferenceToggle(props: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        aria-label={props.label}
        checked={props.checked}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.checked)}
        className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-950"
      />
    </label>
  );
}

function SegmentedControl<T extends string>(props: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; hint?: string }>;
  disabled?: boolean;
}) {
  return (
    <div className={cx("inline-flex rounded-full bg-neutral-100 p-1 dark:bg-neutral-800/80", props.disabled && "opacity-60")}>
      {props.options.map((opt) => {
        const active = opt.value === props.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => props.onChange(opt.value)}
            disabled={props.disabled}
            title={opt.hint}
            className={cx(
              "rounded-full px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed",
              active
                ? "bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-950 dark:text-neutral-50 dark:ring-neutral-800"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function HtmlPreviewFrame({ html, className }: { html: string; className?: string }) {
  const srcDoc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base target="_blank" />
    <style>
      :root { color-scheme: only light; }
      body {
        margin: 0;
        padding: 18px;
        font-family: ${SUBSTACK_SANS_FONT_STACK};
        line-height: 1.6;
      }
      img { max-width: 100%; height: auto; }
      hr { border: none; border-top: 1px solid #e5e7eb; margin: 18px 0; }
      h1, h2, h3, h4, h5, h6 { font-family: ${SUBSTACK_SANS_FONT_STACK}; color: #111111; }
      a { color: #111111; text-decoration: underline; text-underline-offset: 2px; text-decoration-thickness: 1px; }
      pre, code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    </style>
  </head>
  <body>${html}</body>
</html>`;

  return (
    <iframe
      title="Newsletter HTML Preview"
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      className={cx(
        "w-full rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950",
        className || "h-[620px]"
      )}
      srcDoc={srcDoc}
    />
  );
}

const newsletterStarterMarkdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className={getNewsletterStarterHeadingClassName(2)}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className={getNewsletterStarterHeadingClassName(3)}>
      {children}
    </h3>
  ),
  hr: () => (
    <hr className="my-8 border-0 border-t border-neutral-200 dark:border-neutral-800" />
  ),
};

function withSelectionWrap(
  ref: HTMLTextAreaElement | null,
  value: string,
  before: string,
  after: string,
  fallback: string
) {
  if (!ref) {
    return `${value}${before}${fallback}${after}`;
  }

  const start = ref.selectionStart ?? value.length;
  const end = ref.selectionEnd ?? start;
  const selected = value.slice(start, end) || fallback;
  return `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
}

function withSelectionPrefix(ref: HTMLTextAreaElement | null, value: string, prefix: string, fallback: string) {
  if (!ref) return `${value}\n${prefix}${fallback}`;

  const start = ref.selectionStart ?? value.length;
  const end = ref.selectionEnd ?? start;
  const selected = value.slice(start, end) || fallback;
  const transformed = selected
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");

  return `${value.slice(0, start)}${transformed}${value.slice(end)}`;
}

function countWords(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function MarkdownToolbar(props: {
  onApply: (kind: MarkdownFormatKind) => void;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap gap-2", props.className)}>
      {MARKDOWN_TOOLBAR_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => props.onApply(action.id)}
          className="rounded-md border px-2 py-1 text-xs"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

export function NewsletterStudio() {
  const [mode, setMode] = useState<Mode>("compose");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [templates, setTemplates] = useState<Record<NewsletterType, NewsletterTemplate> | null>(null);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriberRowDraft[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [subscribersLoaded, setSubscribersLoaded] = useState(false);

  const [composeForm, setComposeForm] = useState<CampaignDraft>({
    newsletterType: "news",
    subject: "",
    previewText: "",
    contentMode: "template",
    markdownContent: "",
    manualHtml: "",
    manualText: "",
    timeframePreset: "weekly",
    periodDays: 7,
    minimumRelevance: 1,
    scheduledAtLocal: "",
  });
  const [composePreview, setComposePreview] = useState<CampaignPreviewResult | null>(null);
  const [composePreviewTab, setComposePreviewTab] = useState<PreviewTab>("html");
  const [composeWorkspaceView, setComposeWorkspaceView] = useState<WorkspaceView>("split");
  const [composePreviewLoading, setComposePreviewLoading] = useState(false);
  const [composeFocusedField, setComposeFocusedField] = useState<ComposeFieldKey | null>(null);

  const [queueFilter, setQueueFilter] = useState<CampaignStatus | "all">("all");
  const [queueSearch, setQueueSearch] = useState("");
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editingCampaignMode, setEditingCampaignMode] = useState<CampaignEditMode>("campaign");
  const [editForm, setEditForm] = useState<CampaignDraft | null>(null);
  const [editPreview, setEditPreview] = useState<CampaignPreviewResult | null>(null);
  const [editPreviewTab, setEditPreviewTab] = useState<PreviewTab>("html");
  const [editPreviewLoading, setEditPreviewLoading] = useState(false);
  const [editFocusedField, setEditFocusedField] = useState<ComposeFieldKey | null>(null);
  const [editWorkspaceView, setEditWorkspaceView] = useState<WorkspaceView>("split");

  const [activeTemplateType, setActiveTemplateType] = useState<NewsletterType>("news");
  const [templateDraft, setTemplateDraft] = useState<NewsletterTemplate | null>(null);
  const [templatePreview, setTemplatePreview] = useState<TemplatePreviewResult | null>(null);
  const [templatePreviewTab, setTemplatePreviewTab] = useState<PreviewTab>("html");
  const [templatePreviewContext, setTemplatePreviewContext] = useState({
    timeframePreset: "weekly" as NewsletterSummaryTimeframePreset,
    periodDays: 7,
    minimumRelevance: 1,
    campaignSubject: "Weekly News Digest",
  });
  const [focusedTemplateField, setFocusedTemplateField] = useState<TemplateFieldKey | null>(null);

  const composeMarkdownRef = useRef<HTMLTextAreaElement | null>(null);
  const composeManualHtmlRef = useRef<HTMLTextAreaElement | null>(null);
  const composeManualTextRef = useRef<HTMLTextAreaElement | null>(null);

  const templateSubjectRef = useRef<HTMLInputElement | null>(null);
  const templateHtmlRef = useRef<HTMLTextAreaElement | null>(null);
  const templateTextRef = useRef<HTMLTextAreaElement | null>(null);
  const templateMarkdownRef = useRef<HTMLTextAreaElement | null>(null);

  const editMarkdownRef = useRef<HTMLTextAreaElement | null>(null);
  const editManualHtmlRef = useRef<HTMLTextAreaElement | null>(null);
  const editManualTextRef = useRef<HTMLTextAreaElement | null>(null);
  const [editInitialSnapshot, setEditInitialSnapshot] = useState<string | null>(null);

  const statusMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setComposeSummaryPreset = useCallback((timeframePreset: NewsletterSummaryTimeframePreset) => {
    setComposeForm((current) => applySummaryPreset(current, timeframePreset));
  }, []);

  const setEditSummaryPreset = useCallback((timeframePreset: NewsletterSummaryTimeframePreset) => {
    setEditForm((current) => (current ? applySummaryPreset(current, timeframePreset) : current));
  }, []);

  const setTemplateSummaryPreset = useCallback((timeframePreset: NewsletterSummaryTimeframePreset) => {
    setTemplatePreviewContext((current) => applySummaryPreset(current, timeframePreset));
  }, []);

  const setStatusMessage = (value: string) => {
    setMessage(value);
    if (statusMessageTimerRef.current) {
      clearTimeout(statusMessageTimerRef.current);
    }
    statusMessageTimerRef.current = setTimeout(() => {
      setMessage(null);
      statusMessageTimerRef.current = null;
    }, 4000);
  };

  useEffect(() => {
    return () => {
      if (statusMessageTimerRef.current) {
        clearTimeout(statusMessageTimerRef.current);
      }
    };
  }, []);

  const refreshData = useCallback(async () => {
    setError(null);
    setAvailabilityError(null);

    const headers = { "x-api-key": getAdminApiKey() };
    const [campaignsResult, templatesResult] = await Promise.all([
      adminFetch<NewsletterCampaign[]>("/api/v1/newsletter/campaigns?limit=100", { headers }),
      adminFetch<NewsletterTemplate[]>("/api/v1/newsletter/templates", { headers }),
    ]);

    const availabilityReason =
      getAvailabilityReason(campaignsResult.meta) ||
      getAvailabilityReason(templatesResult.meta);
    setAvailabilityError(availabilityReason);

    if (campaignsResult.error) {
      setError(campaignsResult.error);
    } else {
      setCampaigns(campaignsResult.data || []);
    }

    if (templatesResult.error) {
      setError((prev) => prev || templatesResult.error);
    } else {
      const byType = Object.fromEntries((templatesResult.data || []).map((x) => [x.newsletterType, x])) as Record<
        NewsletterType,
        NewsletterTemplate
      >;
      setTemplates(byType);
      setTemplateDraft(byType[activeTemplateType] || null);
    }
  }, [activeTemplateType]);

  const refreshSubscribers = useCallback(async () => {
    setSubscribersLoading(true);
    setError(null);

    const result = await adminFetch<NewsletterSubscriberApiRow[]>("/api/v1/newsletter/subscribers?limit=200", {
      headers: { "x-api-key": getAdminApiKey() },
    });

    setSubscribersLoading(false);

    const availabilityReason = getAvailabilityReason(result.meta);
    setAvailabilityError((current) =>
      nextAvailabilityErrorAfterSubscribersRefresh({
        previousAvailabilityError: current,
        subscriberAvailabilityReason: availabilityReason,
      })
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    setSubscribers((result.data || []).map((subscriber) => toSubscriberDraftRow(subscriber)));
    setSubscribersLoaded(true);
  }, []);

  const ensureNewsletterWritable = useCallback(() => {
    if (!availabilityError) return true;
    setError(availabilityError);
    return false;
  }, [availabilityError]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    load();
  }, [refreshData]);

  const handleModeChange = useCallback((next: Mode) => {
    setMode(next);
    if (
      shouldLoadSubscribersOnModeChange({
        nextMode: next,
        subscribersLoaded,
        subscribersLoading,
      })
    ) {
      void refreshSubscribers();
    }
  }, [refreshSubscribers, subscribersLoaded, subscribersLoading]);

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const q = queueSearch.trim().toLowerCase();
    return sortedCampaigns.filter((item) => {
      if (queueFilter !== "all" && item.status !== queueFilter) return false;
      if (!q) return true;
      return item.subject.toLowerCase().includes(q) || item.newsletterType.toLowerCase().includes(q);
    });
  }, [queueFilter, queueSearch, sortedCampaigns]);

  const templateIsDirty = useMemo(() => {
    if (!templateDraft || !templates) return false;
    const base = templates[templateDraft.newsletterType];
    if (!base) return true;
    return (
      base.subjectTemplate !== templateDraft.subjectTemplate ||
      base.htmlTemplate !== templateDraft.htmlTemplate ||
      base.textTemplate !== templateDraft.textTemplate ||
      base.markdownTemplate !== templateDraft.markdownTemplate
    );
  }, [templateDraft, templates]);

  const isEditDirty = useMemo(() => {
    const currentSnapshot = serializeCampaignDraft(editForm);
    if (!currentSnapshot || !editInitialSnapshot) return false;
    return currentSnapshot !== editInitialSnapshot;
  }, [editForm, editInitialSnapshot]);

  const resolvedPlaceholders = useMemo(() => {
    const source = composePreview?.placeholders?.length
      ? composePreview.placeholders
      : templatePreview?.placeholders?.length
        ? templatePreview.placeholders
        : [...FALLBACK_PLACEHOLDERS];
    return orderPlaceholders(source.filter((placeholder) => !isHtmlPlaceholderToken(placeholder)));
  }, [composePreview, templatePreview]);

  const composeInsertablePlaceholders = useMemo(() => {
    if (composeForm.contentMode === "markdown") {
      return filterRelevantPlaceholders(resolvedPlaceholders, MARKDOWN_WRITING_PLACEHOLDERS);
    }

    if (composeFocusedField === "manualHtml") {
      return filterRelevantPlaceholders(resolvedPlaceholders, MINIMAL_WRITING_PLACEHOLDERS);
    }

    return filterRelevantPlaceholders(resolvedPlaceholders, TEXT_WRITING_PLACEHOLDERS);
  }, [composeForm.contentMode, composeFocusedField, resolvedPlaceholders]);

  const editInsertablePlaceholders = useMemo(() => {
    if (!editForm) return resolvedPlaceholders;
    if (editForm.contentMode === "markdown") {
      return filterRelevantPlaceholders(resolvedPlaceholders, MARKDOWN_WRITING_PLACEHOLDERS);
    }

    if (editFocusedField === "manualHtml") {
      return filterRelevantPlaceholders(resolvedPlaceholders, MINIMAL_WRITING_PLACEHOLDERS);
    }

    return filterRelevantPlaceholders(resolvedPlaceholders, TEXT_WRITING_PLACEHOLDERS);
  }, [editForm, editFocusedField, resolvedPlaceholders]);

  const templateInsertablePlaceholders = useMemo(() => {
    const field = focusedTemplateField || "markdownTemplate";
    if (field === "subjectTemplate") {
      return filterRelevantPlaceholders(resolvedPlaceholders, SUBJECT_WRITING_PLACEHOLDERS);
    }
    if (field === "markdownTemplate") {
      return filterRelevantPlaceholders(resolvedPlaceholders, MARKDOWN_WRITING_PLACEHOLDERS);
    }
    if (field === "textTemplate") {
      return filterRelevantPlaceholders(resolvedPlaceholders, TEXT_WRITING_PLACEHOLDERS);
    }
    return filterRelevantPlaceholders(resolvedPlaceholders, MINIMAL_WRITING_PLACEHOLDERS);
  }, [focusedTemplateField, resolvedPlaceholders]);

  const composeSummary = useMemo(
    () => resolveNewsletterSummaryControls(composeForm),
    [composeForm]
  );

  const requestCampaignPreview = useCallback(
    async (draft: CampaignDraft) => {
      const summary = resolveNewsletterSummaryControls({
        timeframePreset: draft.timeframePreset,
        periodDays: draft.periodDays,
        minimumRelevance: draft.minimumRelevance,
      });

      const payload = {
        newsletterType: draft.newsletterType,
        subject: draft.subject.trim() || getSuggestedNewsletterSubject({
          newsletterType: draft.newsletterType,
          timeframePreset: summary.timeframePreset,
          periodDays: summary.periodDays,
        }),
        timeframePreset: summary.timeframePreset,
        periodDays: summary.periodDays,
        minimumRelevance: summary.minimumRelevance,
        contentMode: draft.contentMode,
        markdownContent: draft.contentMode === "markdown" ? draft.markdownContent : undefined,
        manualHtml: draft.contentMode === "manual" ? draft.manualHtml : undefined,
        manualText: draft.contentMode === "manual" ? draft.manualText : undefined,
      };

      return adminFetch<CampaignPreviewResult>("/api/v1/newsletter/campaigns/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getAdminApiKey(),
        },
        body: JSON.stringify(payload),
      });
    },
    []
  );

  const renderComposePreview = useCallback(async () => {
    setComposePreviewLoading(true);
    const result = await requestCampaignPreview(composeForm);
    setComposePreviewLoading(false);

    if (result.error || !result.data) {
      setError(result.error || "Unable to render preview");
      return;
    }

    setComposePreview(result.data);
  }, [composeForm, requestCampaignPreview]);

  useEffect(() => {
    if (!canAutoRenderComposePreview({ loading, mode, draft: composeForm })) return;

    const handle = setTimeout(() => {
      void renderComposePreview();
    }, 250);

    return () => clearTimeout(handle);
  }, [composeForm, loading, mode, renderComposePreview]);

  const closeEditPanel = useCallback(
    (force = false) => {
      if (!force && isEditDirty) {
        const confirmed = confirm("Discard unsaved campaign edits?");
        if (!confirmed) return false;
      }

      setEditingCampaignId(null);
      setEditingCampaignMode("campaign");
      setEditForm(null);
      setEditPreview(null);
      setEditPreviewLoading(false);
      setEditInitialSnapshot(null);
      return true;
    },
    [isEditDirty]
  );

  const createCampaign = async () => {
    if (!ensureNewsletterWritable()) return;
    if (!composeForm.subject.trim()) {
      setError("Subject is required");
      return;
    }

    const summary = resolveNewsletterSummaryControls({
      timeframePreset: composeForm.timeframePreset,
      periodDays: composeForm.periodDays,
      minimumRelevance: composeForm.minimumRelevance,
    });

    setSaving(true);
    setError(null);

    const { error: createError } = await adminFetch("/api/v1/newsletter/campaigns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify({
        newsletterType: composeForm.newsletterType,
        subject: composeForm.subject,
        previewText: composeForm.previewText || undefined,
        timeframePreset: summary.timeframePreset,
        periodDays: summary.periodDays,
        minimumRelevance: summary.minimumRelevance,
        scheduledAt: composeForm.scheduledAtLocal ? new Date(composeForm.scheduledAtLocal).toISOString() : undefined,
        createdBy: "admin-news-studio",
        contentMode: composeForm.contentMode,
        markdownContent: composeForm.contentMode === "markdown" ? composeForm.markdownContent : undefined,
        manualHtml: composeForm.contentMode === "manual" ? composeForm.manualHtml : undefined,
        manualText: composeForm.contentMode === "manual" ? composeForm.manualText : undefined,
      }),
    });

    setSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setStatusMessage("Draft created");
    setComposeForm((current) => ({
      ...current,
      subject: "",
      previewText: "",
      timeframePreset: current.timeframePreset,
      periodDays: current.periodDays,
      minimumRelevance: current.minimumRelevance,
      scheduledAtLocal: "",
      markdownContent: current.contentMode === "markdown" ? current.markdownContent : "",
      manualHtml: current.contentMode === "manual" ? current.manualHtml : "",
      manualText: current.contentMode === "manual" ? current.manualText : "",
    }));

    await refreshData();
    setMode("queue");
  };

  const autoCreateWeekly = async () => {
    if (!ensureNewsletterWritable()) return;
    setSaving(true);
    setError(null);

    const result = await adminFetch<{
      created: boolean;
      periodStart: string;
      periodEnd: string;
    }>("/api/v1/newsletter/campaigns/auto-create-weekly", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify({
        timeframePreset: "weekly",
        periodDays: 7,
        minimumRelevance: 1,
        createdBy: "admin-news-studio:auto",
      }),
    });

    setSaving(false);

    if (result.error || !result.data) {
      setError(result.error || "Unable to auto-create weekly issue");
      return;
    }

    setStatusMessage(
      result.data.created
        ? `Created weekly draft for ${result.data.periodStart} to ${result.data.periodEnd}`
        : `Weekly draft already exists for ${result.data.periodStart} to ${result.data.periodEnd}`
    );

    await refreshData();
    setMode("queue");
  };

  const scheduleCampaign = async (campaignId: string) => {
    if (!ensureNewsletterWritable()) return;
    const localValue = scheduleDrafts[campaignId];
    if (!localValue) {
      setError("Pick a schedule date/time first");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: scheduleError } = await adminFetch(`/api/v1/newsletter/campaigns/${campaignId}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify({ scheduledAt: new Date(localValue).toISOString() }),
    });

    setSaving(false);

    if (scheduleError) {
      setError(scheduleError);
      return;
    }

    setStatusMessage("Campaign scheduled");
    await refreshData();
  };

  const sendNow = async (campaignId: string) => {
    if (!ensureNewsletterWritable()) return;
    setSaving(true);
    setError(null);

    const { error: sendError } = await adminFetch(`/api/v1/newsletter/campaigns/${campaignId}/send`, {
      method: "POST",
      headers: { "x-api-key": getAdminApiKey() },
    });

    setSaving(false);

    if (sendError) {
      setError(sendError);
      return;
    }

    setStatusMessage("Campaign send started");
    await refreshData();
  };

  const deleteCampaign = async (campaign: NewsletterCampaign) => {
    if (!ensureNewsletterWritable()) return;
    if (!MUTABLE_STATUSES.has(campaign.status)) return;
    const ok = confirm(`Delete draft \"${campaign.subject}\"? This cannot be undone.`);
    if (!ok) return;

    setSaving(true);
    setError(null);

    const { error: deleteError } = await adminFetch(`/api/v1/newsletter/campaigns/${campaign.id}`, {
      method: "DELETE",
      headers: { "x-api-key": getAdminApiKey() },
    });

    setSaving(false);

    if (deleteError) {
      setError(deleteError);
      return;
    }

    if (editingCampaignId === campaign.id) {
      closeEditPanel(true);
    }

    setStatusMessage("Campaign deleted");
    await refreshData();
  };

  const openCampaignEditor = async (campaignId: string, mode: CampaignEditMode = "campaign") => {
    if (!ensureNewsletterWritable()) return;
    if (editingCampaignId && isEditDirty) {
      const confirmed = confirm("You have unsaved campaign edits. Continue and discard them?");
      if (!confirmed) return;
    }

    setSaving(true);
    setError(null);

    const result = await adminFetch<NewsletterCampaign>(`/api/v1/newsletter/campaigns/${campaignId}`, {
      headers: { "x-api-key": getAdminApiKey() },
    });

    setSaving(false);

    if (result.error || !result.data) {
      setError(result.error || "Unable to load campaign");
      return;
    }

    const campaign = result.data;
    const archiveMode = mode === "archive";
    const summary = resolveNewsletterSummaryControls({
      timeframePreset: campaign.timeframePreset ?? "weekly",
      periodDays: campaign.periodDays,
      minimumRelevance: campaign.minimumRelevance,
    });
    const draft: CampaignDraft = {
      newsletterType: campaign.newsletterType,
      subject: archiveMode ? (campaign.archiveSubject || campaign.subject) : campaign.subject,
      previewText: archiveMode ? (campaign.archivePreviewText || campaign.previewText || "") : (campaign.previewText || ""),
      contentMode: archiveMode
        ? ((campaign.archiveContentMode || campaign.contentMode) as NewsletterContentMode)
        : campaign.contentMode,
      markdownContent: archiveMode
        ? (campaign.archiveMarkdownContent || campaign.markdownContent || "")
        : (campaign.markdownContent || ""),
      manualHtml: archiveMode
        ? (campaign.archiveManualHtml || campaign.manualHtml || "")
        : (campaign.manualHtml || ""),
      manualText: archiveMode
        ? (campaign.archiveManualText || campaign.manualText || "")
        : (campaign.manualText || ""),
      timeframePreset: summary.timeframePreset,
      periodDays: summary.periodDays,
      minimumRelevance: summary.minimumRelevance,
      scheduledAtLocal: formatLocalInputFromIso(campaign.scheduledAt),
    };

    setEditingCampaignId(campaign.id);
    setEditingCampaignMode(mode);
    setEditForm(draft);
    setEditInitialSnapshot(serializeCampaignDraft(draft));
    setEditPreview(null);
    setEditPreviewTab("html");
  };

  const saveCampaignEdit = async () => {
    if (!ensureNewsletterWritable()) return;
    if (!editingCampaignId || !editForm) return;
    const archiveOnly = editingCampaignMode === "archive";
    const summary = resolveNewsletterSummaryControls({
      timeframePreset: editForm.timeframePreset,
      periodDays: editForm.periodDays,
      minimumRelevance: editForm.minimumRelevance,
    });

    setSaving(true);
    setError(null);

    const { error: updateError } = await adminFetch(`/api/v1/newsletter/campaigns/${editingCampaignId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify({
        newsletterType: editForm.newsletterType,
        subject: editForm.subject,
        previewText: editForm.previewText,
        timeframePreset: summary.timeframePreset,
        periodDays: summary.periodDays,
        minimumRelevance: summary.minimumRelevance,
        scheduledAt: archiveOnly
          ? undefined
          : (editForm.scheduledAtLocal ? new Date(editForm.scheduledAtLocal).toISOString() : null),
        contentMode: editForm.contentMode,
        markdownContent: editForm.contentMode === "markdown" ? editForm.markdownContent : null,
        manualHtml: editForm.contentMode === "manual" ? editForm.manualHtml : null,
        manualText: editForm.contentMode === "manual" ? editForm.manualText : null,
        archiveOnly,
      }),
    });

    setSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setStatusMessage(archiveOnly ? "Archive correction saved" : "Campaign updated");
    setEditInitialSnapshot(serializeCampaignDraft(editForm));
    await refreshData();
  };

  const renderEditPreview = useCallback(async () => {
    if (!editForm) return;
    setEditPreviewLoading(true);

    const result = await requestCampaignPreview(editForm);

    setEditPreviewLoading(false);

    if (result.error || !result.data) {
      setError(result.error || "Unable to render preview");
      return;
    }

    setEditPreview(result.data);
  }, [editForm, requestCampaignPreview]);

  useEffect(() => {
    if (mode !== "queue" || !editForm) return;

    const handle = setTimeout(() => {
      void renderEditPreview();
    }, 250);

    return () => clearTimeout(handle);
  }, [mode, editForm, renderEditPreview]);

  const saveTemplate = async () => {
    if (!ensureNewsletterWritable()) return;
    if (!templateDraft) return;

    setSaving(true);
    setError(null);

    const { error: saveError } = await adminFetch("/api/v1/newsletter/templates", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify(templateDraft),
    });

    setSaving(false);

    if (saveError) {
      setError(saveError);
      return;
    }

    setStatusMessage("Template saved");
    await refreshData();
  };

  const renderTemplatePreview = async () => {
    if (!templateDraft) return;
    const summary = resolveNewsletterSummaryControls(templatePreviewContext);

    setSaving(true);
    setError(null);

    const result = await adminFetch<TemplatePreviewResult>("/api/v1/newsletter/templates/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify({
        newsletterType: templateDraft.newsletterType,
        timeframePreset: summary.timeframePreset,
        periodDays: summary.periodDays,
        minimumRelevance: summary.minimumRelevance,
        campaignSubject: templatePreviewContext.campaignSubject,
        subjectTemplate: templateDraft.subjectTemplate,
        htmlTemplate: templateDraft.htmlTemplate,
        textTemplate: templateDraft.textTemplate,
        markdownTemplate: templateDraft.markdownTemplate,
      }),
    });

    setSaving(false);

    if (result.error || !result.data) {
      setError(result.error || "Unable to render template preview");
      return;
    }

    setTemplatePreview(result.data);
  };

  const insertComposeToken = (placeholder: string) => {
    const token = `{{${placeholder}}}`;
    const field = composeFocusedField || (composeForm.contentMode === "manual" ? "manualText" : "markdownContent");

    if (field === "markdownContent") {
      const el = composeMarkdownRef.current;
      const value = composeForm.markdownContent;
      const start = el?.selectionStart ?? value.length;
      const end = el?.selectionEnd ?? start;
      setComposeForm((current) => ({
        ...current,
        markdownContent: `${value.slice(0, start)}${token}${value.slice(end)}`,
      }));
      return;
    }

    if (field === "manualHtml") {
      const el = composeManualHtmlRef.current;
      const value = composeForm.manualHtml;
      const start = el?.selectionStart ?? value.length;
      const end = el?.selectionEnd ?? start;
      setComposeForm((current) => ({
        ...current,
        manualHtml: `${value.slice(0, start)}${token}${value.slice(end)}`,
      }));
      return;
    }

    const el = composeManualTextRef.current;
    const value = composeForm.manualText;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    setComposeForm((current) => ({
      ...current,
      manualText: `${value.slice(0, start)}${token}${value.slice(end)}`,
    }));
  };

  const insertEditToken = (placeholder: string) => {
    if (!editForm) return;

    const token = `{{${placeholder}}}`;
    const field = editFocusedField || (editForm.contentMode === "manual" ? "manualText" : "markdownContent");

    if (field === "markdownContent") {
      const el = editMarkdownRef.current;
      const value = editForm.markdownContent;
      const start = el?.selectionStart ?? value.length;
      const end = el?.selectionEnd ?? start;
      setEditForm((current) =>
        current ? { ...current, markdownContent: `${value.slice(0, start)}${token}${value.slice(end)}` } : current
      );
      return;
    }

    if (field === "manualHtml") {
      const el = editManualHtmlRef.current;
      const value = editForm.manualHtml;
      const start = el?.selectionStart ?? value.length;
      const end = el?.selectionEnd ?? start;
      setEditForm((current) =>
        current ? { ...current, manualHtml: `${value.slice(0, start)}${token}${value.slice(end)}` } : current
      );
      return;
    }

    const el = editManualTextRef.current;
    const value = editForm.manualText;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    setEditForm((current) =>
      current ? { ...current, manualText: `${value.slice(0, start)}${token}${value.slice(end)}` } : current
    );
  };

  const insertTemplateToken = (placeholder: string) => {
    if (!templateDraft) return;
    const token = `{{${placeholder}}}`;
    const field = focusedTemplateField || "markdownTemplate";

    const refs: Record<TemplateFieldKey, HTMLInputElement | HTMLTextAreaElement | null> = {
      subjectTemplate: templateSubjectRef.current,
      htmlTemplate: templateHtmlRef.current,
      textTemplate: templateTextRef.current,
      markdownTemplate: templateMarkdownRef.current,
    };

    const ref = refs[field];
    const value = templateDraft[field];
    const start = ref?.selectionStart ?? value.length;
    const end = ref?.selectionEnd ?? start;

    setTemplateDraft({
      ...templateDraft,
      [field]: `${value.slice(0, start)}${token}${value.slice(end)}`,
    });
  };

  const applyMarkdownFormat = (
    value: string,
    ref: HTMLTextAreaElement | null,
    kind: MarkdownFormatKind
  ) => {
    let next = value;
    if (kind === "h2") next = withSelectionPrefix(ref, value, "## ", "Heading");
    if (kind === "bold") next = withSelectionWrap(ref, value, "**", "**", "bold text");
    if (kind === "italic") next = withSelectionWrap(ref, value, "*", "*", "italic text");
    if (kind === "link") next = withSelectionWrap(ref, value, "[", "](https://)", "link text");
    if (kind === "list") next = withSelectionPrefix(ref, value, "- ", "List item");
    if (kind === "quote") next = withSelectionPrefix(ref, value, "> ", "Quote");
    if (kind === "code") next = withSelectionWrap(ref, value, "```\n", "\n```", "code");
    if (kind === "divider") next = `${value}\n\n---\n\n`;
    return next;
  };

  const handleMarkdownHotkeys = (
    event: KeyboardEvent<HTMLTextAreaElement>,
    onApply: (kind: MarkdownFormatKind) => void
  ) => {
    if (!(event.metaKey || event.ctrlKey)) return;

    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      onApply("bold");
      return;
    }
    if (key === "i") {
      event.preventDefault();
      onApply("italic");
      return;
    }
    if (key === "k") {
      event.preventDefault();
      onApply("link");
    }
  };

  const applyComposeMarkdownFormat = (kind: MarkdownFormatKind) => {
    const ref = composeMarkdownRef.current;
    const value = composeForm.markdownContent;
    const next = applyMarkdownFormat(value, ref, kind);
    setComposeForm((current) => ({ ...current, markdownContent: next }));
  };

  const applyEditMarkdownFormat = (kind: MarkdownFormatKind) => {
    if (!editForm) return;

    const ref = editMarkdownRef.current;
    const value = editForm.markdownContent;
    const next = applyMarkdownFormat(value, ref, kind);

    setEditForm((current) => (current ? { ...current, markdownContent: next } : current));
  };

  const autofillComposeMarkdown = async (forceOverride: boolean) => {
    if (composeForm.contentMode !== "markdown") return;

    if (composeForm.markdownContent.trim()) {
      const ok = confirm(
        forceOverride
          ? "This will overwrite existing markdown content. Continue?"
          : "Markdown already has content. Replace with template starter?"
      );
      if (!ok) return;
    }

    setSaving(true);
    setError(null);
    const result = await requestCampaignPreview({
      ...composeForm,
      contentMode: "template",
      markdownContent: "",
      manualHtml: "",
      manualText: "",
    });
    setSaving(false);

    if (result.error || !result.data) {
      setError(result.error || "Unable to generate starter markdown");
      return;
    }

    setComposeForm((current) => ({ ...current, markdownContent: result.data!.starter.markdown }));
    setComposePreview(result.data);
  };

  const autofillComposeManual = async (forceOverride: boolean) => {
    if (composeForm.contentMode !== "manual") return;

    if (composeForm.manualHtml.trim() || composeForm.manualText.trim()) {
      const ok = confirm(
        forceOverride
          ? "This will overwrite existing manual HTML/Text content. Continue?"
          : "Manual HTML/Text already has content. Replace with template output?"
      );
      if (!ok) return;
    }

    setSaving(true);
    setError(null);
    const result = await requestCampaignPreview({
      ...composeForm,
      contentMode: "template",
      markdownContent: "",
      manualHtml: "",
      manualText: "",
    });
    setSaving(false);

    if (result.error || !result.data) {
      setError(result.error || "Unable to generate manual content from template");
      return;
    }

    setComposeForm((current) => ({
      ...current,
      manualHtml: result.data!.rendered.html,
      manualText: result.data!.rendered.text,
    }));
    setComposePreview(result.data);
  };

  const autofillEditMarkdown = async (forceOverride: boolean) => {
    if (!editForm || editForm.contentMode !== "markdown") return;

    if (editForm.markdownContent.trim()) {
      const ok = confirm(
        forceOverride
          ? "This will overwrite existing markdown content in this draft. Continue?"
          : "Markdown already has content. Replace with template starter?"
      );
      if (!ok) return;
    }

    setSaving(true);
    setError(null);
    const result = await requestCampaignPreview({
      ...editForm,
      contentMode: "template",
      markdownContent: "",
      manualHtml: "",
      manualText: "",
    });
    setSaving(false);

    if (result.error || !result.data) {
      setError(result.error || "Unable to generate starter markdown");
      return;
    }

    setEditForm((current) => (current ? { ...current, markdownContent: result.data!.starter.markdown } : current));
    setEditPreview(result.data);
  };

  const autofillEditManual = async (forceOverride: boolean) => {
    if (!editForm || editForm.contentMode !== "manual") return;

    if (editForm.manualHtml.trim() || editForm.manualText.trim()) {
      const ok = confirm(
        forceOverride
          ? "This will overwrite existing manual HTML/Text content in this draft. Continue?"
          : "Manual HTML/Text already has content. Replace with template output?"
      );
      if (!ok) return;
    }

    setSaving(true);
    setError(null);
    const result = await requestCampaignPreview({
      ...editForm,
      contentMode: "template",
      markdownContent: "",
      manualHtml: "",
      manualText: "",
    });
    setSaving(false);

    if (result.error || !result.data) {
      setError(result.error || "Unable to generate manual content from template");
      return;
    }

    setEditForm((current) =>
      current
        ? {
          ...current,
          manualHtml: result.data!.rendered.html,
          manualText: result.data!.rendered.text,
        }
        : current
    );
    setEditPreview(result.data);
  };

  const setComposeContentMode = (next: NewsletterContentMode) => {
    setComposeForm((current) => ({ ...current, contentMode: next }));
  };

  const setEditContentMode = (next: NewsletterContentMode) => {
    setEditForm((current) => (current ? { ...current, contentMode: next } : current));
  };

  const setSubscriberDraftFlag = (subscriberId: string, newsletterType: NewsletterType, enabled: boolean) => {
    setSubscribers((current) =>
      current.map((subscriber) =>
        subscriber.id === subscriberId
          ? {
            ...subscriber,
            draft: { ...subscriber.draft, [newsletterType]: enabled },
            error: null,
          }
          : subscriber
      )
    );
  };

  const resetSubscriberDraft = (subscriberId: string) => {
    setSubscribers((current) =>
      current.map((subscriber) =>
        subscriber.id === subscriberId
          ? {
            ...subscriber,
            draft: { ...subscriber.current },
            error: null,
          }
          : subscriber
      )
    );
  };

  const saveSubscriberDraft = async (subscriberId: string) => {
    if (!ensureNewsletterWritable()) return;
    const subscriber = subscribers.find((row) => row.id === subscriberId);
    if (!subscriber) return;

    setSubscribers((current) =>
      current.map((row) =>
        row.id === subscriberId
          ? {
            ...row,
            saving: true,
            error: null,
          }
          : row
      )
    );

    const result = await adminFetch<SubscriberUpdateResult>(`/api/v1/newsletter/subscribers/${subscriberId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify({ newsletterTypes: buildNewsletterTypes(subscriber.draft) }),
    });

    if (result.error || !result.data) {
      setSubscribers((current) =>
        current.map((row) =>
          row.id === subscriberId
            ? {
              ...row,
              saving: false,
              error: result.error || "Unable to update subscriber preferences",
            }
            : row
        )
      );
      return;
    }

    const nextCurrent = toPreferenceFlags(result.data.preferences);
    setSubscribers((current) =>
      current.map((row) =>
        row.id === subscriberId
          ? {
            ...row,
            status: result.data!.subscriber.status,
            current: nextCurrent,
            draft: { ...nextCurrent },
            saving: false,
            error: null,
          }
          : row
      )
    );
    setStatusMessage(`Updated subscriptions for ${subscriber.email}`);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        Loading newsletter studio...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {availabilityError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
          {availabilityError} Read-only fallbacks are enabled where possible, but
          queue and subscriber write actions stay disabled until migrations are
          applied.
        </div>
      )}

      {error && (
        <ErrorAlert
          message={error}
          onRetry={() => {
            setError(null);
            if (mode === "subscribers") {
              void refreshSubscribers();
              return;
            }
            void refreshData();
          }}
        />
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-base font-semibold text-neutral-900 dark:text-neutral-50">Newsletter Studio</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300">
              Full campaign authoring, queue operations, and template controls.
            </div>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <div className="flex items-center gap-2">
              <SegmentedControl<Mode>
                value={mode}
                onChange={handleModeChange}
                options={[
                  { value: "compose", label: "Compose" },
                  { value: "queue", label: "Queue" },
                  { value: "subscribers", label: "Subscribers" },
                  { value: "templates", label: "Templates" },
                ]}
              />

              {mode === "compose" && (
                <button
                  type="button"
                  onClick={autoCreateWeekly}
                  disabled={saving || composeForm.newsletterType !== "news"}
                  className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Generate weekly draft
                </button>
              )}
            </div>

          </div>
        </div>
      </section>

      {mode === "compose" && (
        <div className="mx-auto w-full max-w-[1680px] space-y-5">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 lg:px-8 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Compose draft</h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Configure campaign metadata and delivery settings.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setComposeForm((current) => {
                    const summary = resolveNewsletterSummaryControls(current);
                    return {
                      ...current,
                      subject: getSuggestedNewsletterSubject({
                        newsletterType: current.newsletterType,
                        timeframePreset: summary.timeframePreset,
                        periodDays: summary.periodDays,
                      }),
                    };
                  })
                }
                className="rounded-xl border px-3 py-2 text-sm font-semibold"
              >
                Use suggested subject
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="space-y-1">
                <span className="text-sm font-semibold">Newsletter type</span>
                <select
                  value={composeForm.newsletterType}
                  onChange={(event) =>
                    setComposeForm((current) => ({ ...current, newsletterType: event.target.value as NewsletterType }))
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                >
                  {NEWSLETTER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold">Summary timeframe</span>
                <select
                  value={composeForm.timeframePreset}
                  onChange={(event) => setComposeSummaryPreset(event.target.value as NewsletterSummaryTimeframePreset)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="custom">Custom</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold">Minimum relevance</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={composeForm.minimumRelevance}
                  onChange={(event) =>
                    setComposeForm((current) => ({ ...current, minimumRelevance: Number(event.target.value) || 1 }))
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              {composeForm.timeframePreset === "custom" && (
                <label className="space-y-1 md:col-span-2 xl:col-span-1">
                  <span className="text-sm font-semibold">Period (days)</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={composeForm.periodDays}
                    onChange={(event) =>
                      setComposeForm((current) => ({ ...current, periodDays: Number(event.target.value) || 7 }))
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>
              )}

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-semibold">Subject</span>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={(event) => setComposeForm((current) => ({ ...current, subject: event.target.value }))}
                  placeholder={getSuggestedNewsletterSubject({
                    newsletterType: composeForm.newsletterType,
                    timeframePreset: composeSummary.timeframePreset,
                    periodDays: composeSummary.periodDays,
                  })}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-semibold">Preview text (optional)</span>
                <input
                  type="text"
                  value={composeForm.previewText}
                  onChange={(event) => setComposeForm((current) => ({ ...current, previewText: event.target.value }))}
                  placeholder="Top updates from the last week"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-semibold">Schedule (optional)</span>
                <input
                  type="datetime-local"
                  value={composeForm.scheduledAtLocal}
                  onChange={(event) =>
                    setComposeForm((current) => ({ ...current, scheduledAtLocal: event.target.value }))
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={createCampaign}
                disabled={saving}
                className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-white"
              >
                Create draft
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 lg:px-8 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Content Workspace</h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Switch between editor, preview, or split view.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <SegmentedControl<WorkspaceView>
                  value={composeWorkspaceView}
                  onChange={setComposeWorkspaceView}
                  options={[
                    { value: "editor", label: "Editor" },
                    { value: "split", label: "Split" },
                    { value: "preview", label: "Preview" },
                  ]}
                />
                <SegmentedControl<PreviewTab>
                  value={composePreviewTab}
                  onChange={setComposePreviewTab}
                  options={[
                    { value: "subject", label: "Subject" },
                    { value: "html", label: "HTML" },
                    { value: "text", label: "Text" },
                    { value: "starter", label: "Starter" },
                  ]}
                />
              </div>
            </div>

            <div className="mt-4 mb-3 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold">Content mode</span>
              <SegmentedControl<NewsletterContentMode>
                value={composeForm.contentMode}
                onChange={setComposeContentMode}
                options={[
                  { value: "template", label: "Template" },
                  { value: "markdown", label: "Markdown" },
                  { value: "manual", label: "Manual" },
                ]}
              />
            </div>

            <div className={cx("mt-4 grid grid-cols-1 gap-6", composeWorkspaceView === "split" && "lg:grid-cols-2")}>
              {composeWorkspaceView !== "preview" && (
              <div className={cx("min-h-[72vh] rounded-xl border border-neutral-200 bg-neutral-50 p-5 lg:p-6 dark:border-neutral-800 dark:bg-neutral-950", composeWorkspaceView === "editor" && "min-h-[78vh]")}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold">Editor</div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">
                    mode: {composeForm.contentMode}
                  </div>
                </div>

                {composeForm.contentMode === "template" && (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                    Template mode has no direct body editor. Switch to Markdown or Manual to edit content directly.
                  </div>
                )}

                {composeForm.contentMode === "markdown" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <MarkdownToolbar onApply={applyComposeMarkdownFormat} />
                      <button
                        type="button"
                        onClick={() => void autofillComposeMarkdown(false)}
                        className="rounded-md border px-2 py-1 text-xs"
                      >
                        Autofill from template
                      </button>
                      <button
                        type="button"
                        onClick={() => void autofillComposeMarkdown(true)}
                        className="rounded-md border px-2 py-1 text-xs"
                      >
                        Regenerate starter
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>Shortcuts: Cmd/Ctrl+B (bold), I (italic), K (link)</span>
                      <span>{countWords(composeForm.markdownContent)} words · {composeForm.markdownContent.length} chars</span>
                    </div>
                    <textarea
                      ref={composeMarkdownRef}
                      rows={composeWorkspaceView === "split" ? 22 : 30}
                      value={composeForm.markdownContent}
                      onFocus={() => setComposeFocusedField("markdownContent")}
                      onKeyDown={(event) => handleMarkdownHotkeys(event, applyComposeMarkdownFormat)}
                      onChange={(event) =>
                        setComposeForm((current) => ({ ...current, markdownContent: event.target.value }))
                      }
                      className="min-h-[56vh] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-sm leading-6 dark:border-neutral-700 dark:bg-neutral-950"
                      placeholder="Write markdown newsletter content..."
                    />

                    <div className="flex flex-wrap gap-2">
                      {composeInsertablePlaceholders.map((placeholder) => (
                        <button
                          key={placeholder}
                          type="button"
                          onClick={() => insertComposeToken(placeholder)}
                          className="rounded-full border px-3 py-1 text-xs"
                        >
                          {`{{${placeholder}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {composeForm.contentMode === "manual" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void autofillComposeManual(false)}
                        className="rounded-md border px-2 py-1 text-xs"
                      >
                        Autofill from template
                      </button>
                      <button
                        type="button"
                        onClick={() => void autofillComposeManual(true)}
                        className="rounded-md border px-2 py-1 text-xs"
                      >
                        Regenerate starter
                      </button>
                    </div>

                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Manual HTML</span>
                      <textarea
                        ref={composeManualHtmlRef}
                        rows={composeWorkspaceView === "split" ? 12 : 16}
                        value={composeForm.manualHtml}
                        onFocus={() => setComposeFocusedField("manualHtml")}
                        onChange={(event) =>
                          setComposeForm((current) => ({ ...current, manualHtml: event.target.value }))
                        }
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-sm leading-6 dark:border-neutral-700 dark:bg-neutral-950"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Manual text</span>
                      <textarea
                        ref={composeManualTextRef}
                        rows={composeWorkspaceView === "split" ? 12 : 16}
                        value={composeForm.manualText}
                        onFocus={() => setComposeFocusedField("manualText")}
                        onChange={(event) =>
                          setComposeForm((current) => ({ ...current, manualText: event.target.value }))
                        }
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-sm leading-6 dark:border-neutral-700 dark:bg-neutral-950"
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {composeInsertablePlaceholders.map((placeholder) => (
                        <button
                          key={placeholder}
                          type="button"
                          onClick={() => insertComposeToken(placeholder)}
                          className="rounded-full border px-3 py-1 text-xs"
                        >
                          {`{{${placeholder}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              )}

              {composeWorkspaceView !== "editor" && (
              <div className={cx("min-h-[72vh] rounded-xl border border-neutral-200 bg-neutral-50 p-5 lg:p-6 dark:border-neutral-800 dark:bg-neutral-950", composeWorkspaceView === "preview" && "min-h-[78vh]")}>
                <div className="mb-3 text-sm font-semibold">Live preview</div>

                {composePreviewLoading && (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
                    Rendering preview...
                  </div>
                )}

                {!composePreviewLoading && !composePreview && (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
                    Preview will appear here.
                  </div>
                )}

                {composePreview && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Digest context</div>
                      <div className="mt-1 text-sm font-semibold">{composePreview.context.digest.heading}</div>
                      <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{composePreview.context.digest.summary}</div>
                    </div>

                    {composePreviewTab === "subject" && (
                      <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Rendered subject</div>
                        <div className="mt-2 text-base font-semibold">{composePreview.rendered.subject}</div>
                      </div>
                    )}

                    {composePreviewTab === "html" && (
                      <HtmlPreviewFrame
                        html={composePreview.rendered.html}
                        className={composeWorkspaceView === "preview" ? "h-[78vh]" : "h-[70vh]"}
                      />
                    )}

                    {composePreviewTab === "text" && (
                      <pre className={cx(
                        "overflow-auto whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-5 text-xs dark:border-neutral-800 dark:bg-neutral-900",
                        composeWorkspaceView === "preview" ? "max-h-[78vh]" : "max-h-[70vh]"
                      )}>
                        {composePreview.rendered.text}
                      </pre>
                    )}

                    {composePreviewTab === "starter" && (
                      <div className="grid grid-cols-1 gap-3">
                        <pre className={cx(
                          "overflow-auto whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-5 text-xs dark:border-neutral-800 dark:bg-neutral-900",
                          composeWorkspaceView === "preview" ? "max-h-[78vh]" : "max-h-[70vh]"
                        )}>
                          {composePreview.starter.markdown}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}
            </div>
          </section>
        </div>
      )}

      {mode === "subscribers" && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Subscribers</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                One row per subscriber with local toggle drafts for News, Jobs, and Candidates.
              </p>
            </div>
            <div className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
              {subscribers.length} loaded
            </div>
          </div>

          {subscribersLoading && subscribers.length === 0 && (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
              Loading subscribers...
            </div>
          )}

          {!subscribersLoading && subscribers.length === 0 && (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
              No subscribers found.
            </div>
          )}

          {subscribers.length > 0 && (
            <div className="mt-5 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full min-w-[1180px] text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-950">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">News</th>
                    <th className="px-4 py-3 text-center">Jobs</th>
                    <th className="px-4 py-3 text-center">Candidates</th>
                    <th className="px-4 py-3">Clicks 7d</th>
                    <th className="px-4 py-3">Last clicked</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => {
                    const isDirty = isPreferenceRowDirty(subscriber.current, subscriber.draft);

                    return (
                      <tr key={subscriber.id} className="border-t border-neutral-200 align-top dark:border-neutral-800">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-neutral-900 dark:text-neutral-50">{subscriber.email}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {isDirty && (
                              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                                Unsaved
                              </span>
                            )}
                            {subscriber.saving && (
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">Saving...</span>
                            )}
                          </div>
                          {subscriber.error && (
                            <div className="mt-2 text-xs text-red-700 dark:text-red-300">{subscriber.error}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <SubscriberStatusPill status={subscriber.status} />
                        </td>
                        {NEWSLETTER_TYPES.map((newsletterType) => (
                          <td key={newsletterType} className="px-4 py-3 text-center">
                            <SubscriberPreferenceToggle
                              checked={subscriber.draft[newsletterType]}
                              disabled={subscriber.saving}
                              label={`${subscriber.email} ${newsletterType} subscription`}
                              onChange={(enabled) => setSubscriberDraftFlag(subscriber.id, newsletterType, enabled)}
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3">{subscriber.clicks7d}</td>
                        <td className="px-4 py-3">
                          {subscriber.lastClickedLink ? (
                            <a
                              href={subscriber.lastClickedLink}
                              target="_blank"
                              rel="noreferrer"
                              className="line-clamp-2 break-all text-xs text-indigo-700 underline decoration-indigo-300 underline-offset-2 dark:text-indigo-300"
                            >
                              {subscriber.lastClickedLink}
                            </a>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{new Date(subscriber.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => resetSubscriberDraft(subscriber.id)}
                              disabled={subscriber.saving || !isDirty}
                              className="rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50"
                            >
                              Reset
                            </button>
                            <button
                              type="button"
                              onClick={() => void saveSubscriberDraft(subscriber.id)}
                              disabled={subscriber.saving || !isDirty}
                              className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {mode === "queue" && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Campaign queue</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Edit, schedule, send, and delete unsent campaigns.
              </p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <SegmentedControl<CampaignStatus | "all">
                value={queueFilter}
                onChange={setQueueFilter}
                options={[
                  { value: "all", label: "All" },
                  { value: "draft", label: "Draft" },
                  { value: "scheduled", label: "Scheduled" },
                  { value: "sending", label: "Sending" },
                  { value: "sent", label: "Sent" },
                  { value: "failed", label: "Failed" },
                ]}
              />
              <input
                type="text"
                value={queueSearch}
                onChange={(event) => setQueueSearch(event.target.value)}
                placeholder="Search subject..."
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 md:w-72"
              />
            </div>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
              No campaigns match this view.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full min-w-[1050px] text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-950">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => {
                    const mutable = MUTABLE_STATUSES.has(campaign.status);
                    const archiveEditable = campaign.status === "sent";
                    return (
                      <tr key={campaign.id} className="border-t border-neutral-200 align-top dark:border-neutral-800">
                        <td className="px-4 py-3">
                          <StatusPill status={campaign.status} />
                          {campaign.failureReason && (
                            <div className="mt-2 text-xs text-red-700 dark:text-red-300">{campaign.failureReason}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 capitalize">{campaign.newsletterType}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{campaign.subject}</div>
                          {campaign.previewText && <div className="mt-1 text-xs text-neutral-500">{campaign.previewText}</div>}
                          <div className="mt-1 text-xs text-neutral-500">mode: {campaign.contentMode}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{new Date(campaign.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 min-w-80">
                          <div className="flex items-center gap-2">
                            <input
                              type="datetime-local"
                              value={scheduleDrafts[campaign.id] || ""}
                              onChange={(event) =>
                                setScheduleDrafts((current) => ({ ...current, [campaign.id]: event.target.value }))
                              }
                              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                            />
                            <button
                              type="button"
                              onClick={() => scheduleCampaign(campaign.id)}
                              disabled={saving || !mutable}
                              className="rounded-xl border px-3 py-2 text-sm font-semibold disabled:opacity-50"
                            >
                              Set
                            </button>
                          </div>
                          {campaign.scheduledAt && (
                            <div className="mt-2 text-xs text-neutral-500">Current: {new Date(campaign.scheduledAt).toLocaleString()}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openCampaignEditor(campaign.id, archiveEditable ? "archive" : "campaign")}
                              disabled={saving || (!mutable && !archiveEditable)}
                              className="rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-50"
                            >
                              {archiveEditable ? "Correct archive" : "Edit"}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteCampaign(campaign)}
                              disabled={saving || !mutable}
                              className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50 dark:border-red-500/30 dark:text-red-300"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => sendNow(campaign.id)}
                              disabled={saving || campaign.status === "sent"}
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Send now
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {editingCampaignId && editForm && (
            <div className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">
                    {editingCampaignMode === "archive" ? "Correct Archive" : "Edit Campaign"}
                  </h3>
                  {isEditDirty && (
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      Unsaved
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <SegmentedControl<WorkspaceView>
                    value={editWorkspaceView}
                    onChange={setEditWorkspaceView}
                    options={[
                      { value: "editor", label: "Editor" },
                      { value: "split", label: "Split" },
                      { value: "preview", label: "Preview" },
                    ]}
                  />
                  <button
                    type="button"
                    onClick={() => closeEditPanel()}
                    className="rounded-lg border px-3 py-1.5 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>

              {editingCampaignMode === "archive" && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  This only updates the archived web version. Emails that were already sent will not change.
                </div>
              )}

              <div className={cx("grid grid-cols-1 gap-4", editWorkspaceView === "split" && "xl:grid-cols-2")}>
                {editWorkspaceView !== "preview" && (
                  <div className={cx("space-y-3", editWorkspaceView === "editor" && "min-h-[68vh]")}>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Type</span>
                      <select
                        value={editForm.newsletterType}
                        disabled={editingCampaignMode === "archive"}
                        onChange={(event) =>
                          setEditForm((current) =>
                            current ? { ...current, newsletterType: event.target.value as NewsletterType } : current
                          )
                        }
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                      >
                        {NEWSLETTER_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Summary timeframe</span>
                      <select
                        value={editForm.timeframePreset}
                        disabled={editingCampaignMode === "archive"}
                        onChange={(event) =>
                          setEditSummaryPreset(event.target.value as NewsletterSummaryTimeframePreset)
                        }
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </label>

                    <label className="space-y-1">
                      <span className="text-sm font-semibold">Minimum relevance</span>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={editForm.minimumRelevance}
                        disabled={editingCampaignMode === "archive"}
                        onChange={(event) =>
                          setEditForm((current) =>
                            current ? { ...current, minimumRelevance: Number(event.target.value) || 1 } : current
                          )
                        }
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                      />
                    </label>

                    {editForm.timeframePreset === "custom" && (
                      <label className="space-y-1 md:col-span-2 xl:col-span-1">
                        <span className="text-sm font-semibold">Period (days)</span>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={editForm.periodDays}
                          disabled={editingCampaignMode === "archive"}
                          onChange={(event) =>
                            setEditForm((current) =>
                              current ? { ...current, periodDays: Number(event.target.value) || 7 } : current
                            )
                          }
                          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                        />
                      </label>
                    )}
                  </div>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Subject</span>
                    <input
                      type="text"
                      value={editForm.subject}
                      onChange={(event) =>
                        setEditForm((current) => (current ? { ...current, subject: event.target.value } : current))
                      }
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Preview text</span>
                    <input
                      type="text"
                      value={editForm.previewText}
                      onChange={(event) =>
                        setEditForm((current) => (current ? { ...current, previewText: event.target.value } : current))
                      }
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold">Schedule</span>
                    <input
                      type="datetime-local"
                      value={editForm.scheduledAtLocal}
                      disabled={editingCampaignMode === "archive"}
                      onChange={(event) =>
                        setEditForm((current) =>
                          current ? { ...current, scheduledAtLocal: event.target.value } : current
                        )
                      }
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                    />
                  </label>

                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Content mode</div>
                    <SegmentedControl<NewsletterContentMode>
                      value={editForm.contentMode}
                      onChange={setEditContentMode}
                      disabled={editingCampaignMode === "archive" ? false : undefined}
                      options={[
                        { value: "template", label: "Template" },
                        { value: "markdown", label: "Markdown" },
                        { value: "manual", label: "Manual" },
                      ]}
                    />
                  </div>

                  {editForm.contentMode === "markdown" && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <MarkdownToolbar onApply={applyEditMarkdownFormat} />
                        <button
                          type="button"
                          onClick={() => void autofillEditMarkdown(false)}
                          className="rounded-md border px-2 py-1 text-xs"
                        >
                          Autofill from template
                        </button>
                        <button
                          type="button"
                          onClick={() => void autofillEditMarkdown(true)}
                          className="rounded-md border px-2 py-1 text-xs"
                        >
                          Regenerate starter
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                          <span>Shortcuts: Cmd/Ctrl+B (bold), I (italic), K (link)</span>
                          <span>{countWords(editForm.markdownContent)} words · {editForm.markdownContent.length} chars</span>
                        </div>
                        <textarea
                          ref={editMarkdownRef}
                          rows={editWorkspaceView === "split" ? 16 : 24}
                          value={editForm.markdownContent}
                          onFocus={() => setEditFocusedField("markdownContent")}
                          onKeyDown={(event) => handleMarkdownHotkeys(event, applyEditMarkdownFormat)}
                          onChange={(event) =>
                            setEditForm((current) =>
                              current ? { ...current, markdownContent: event.target.value } : current
                            )
                          }
                          className="min-h-[46vh] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-sm leading-6 dark:border-neutral-700 dark:bg-neutral-950"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {editInsertablePlaceholders.map((placeholder) => (
                          <button
                            key={placeholder}
                            type="button"
                            onClick={() => insertEditToken(placeholder)}
                            className="rounded-full border px-3 py-1 text-xs"
                          >
                            {`{{${placeholder}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {editForm.contentMode === "manual" && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void autofillEditManual(false)}
                          className="rounded-md border px-2 py-1 text-xs"
                        >
                          Autofill from template
                        </button>
                        <button
                          type="button"
                          onClick={() => void autofillEditManual(true)}
                          className="rounded-md border px-2 py-1 text-xs"
                        >
                          Regenerate starter
                        </button>
                      </div>
                      <textarea
                        ref={editManualHtmlRef}
                        rows={editWorkspaceView === "split" ? 9 : 14}
                        value={editForm.manualHtml}
                        onFocus={() => setEditFocusedField("manualHtml")}
                        onChange={(event) =>
                          setEditForm((current) => (current ? { ...current, manualHtml: event.target.value } : current))
                        }
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-sm leading-6 dark:border-neutral-700 dark:bg-neutral-950"
                        placeholder="Manual HTML"
                      />
                      <textarea
                        ref={editManualTextRef}
                        rows={editWorkspaceView === "split" ? 9 : 14}
                        value={editForm.manualText}
                        onFocus={() => setEditFocusedField("manualText")}
                        onChange={(event) =>
                          setEditForm((current) => (current ? { ...current, manualText: event.target.value } : current))
                        }
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-sm leading-6 dark:border-neutral-700 dark:bg-neutral-950"
                        placeholder="Manual text"
                      />

                      <div className="flex flex-wrap gap-2">
                        {editInsertablePlaceholders.map((placeholder) => (
                          <button
                            key={placeholder}
                            type="button"
                            onClick={() => insertEditToken(placeholder)}
                            className="rounded-full border px-3 py-1 text-xs"
                          >
                            {`{{${placeholder}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {editForm.contentMode === "template" && (
                    <div className="rounded-xl border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900">
                      Campaign uses saved templates only.
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveCampaignEdit}
                      disabled={saving}
                      className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900"
                    >
                      {editingCampaignMode === "archive" ? "Save archive correction" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={renderEditPreview}
                      disabled={saving || editPreviewLoading}
                      className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                      {editPreviewLoading ? "Rendering..." : "Preview"}
                    </button>
                  </div>
                  </div>
                )}

                {editWorkspaceView !== "editor" && (
                  <div className={cx("space-y-3", editWorkspaceView === "preview" && "min-h-[68vh]")}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Edit preview</div>
                    <SegmentedControl<PreviewTab>
                      value={editPreviewTab}
                      onChange={setEditPreviewTab}
                      options={[
                        { value: "subject", label: "Subject" },
                        { value: "html", label: "HTML" },
                        { value: "text", label: "Text" },
                        { value: "starter", label: "Starter" },
                      ]}
                    />
                  </div>

                  {editPreviewLoading && (
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
                      Rendering preview...
                    </div>
                  )}

                  {!editPreviewLoading && !editPreview && (
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
                      Live preview will appear as you edit.
                    </div>
                  )}

                  {editPreview && editPreviewTab === "subject" && (
                    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                      <div className="text-sm font-semibold">{editPreview.rendered.subject}</div>
                    </div>
                  )}

                  {editPreview && editPreviewTab === "html" && (
                    <HtmlPreviewFrame
                      html={editPreview.rendered.html}
                      className={editWorkspaceView === "preview" ? "h-[74vh]" : "h-[560px]"}
                    />
                  )}

                  {editPreview && editPreviewTab === "text" && (
                    <pre
                      className={cx(
                        "overflow-auto whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-4 text-xs dark:border-neutral-800 dark:bg-neutral-900",
                        editWorkspaceView === "preview" ? "max-h-[72vh]" : "max-h-[480px]"
                      )}
                    >
                      {editPreview.rendered.text}
                    </pre>
                  )}

                  {editPreview && editPreviewTab === "starter" && (
                    <pre
                      className={cx(
                        "overflow-auto whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-4 text-xs dark:border-neutral-800 dark:bg-neutral-900",
                        editWorkspaceView === "preview" ? "max-h-[72vh]" : "max-h-[480px]"
                      )}
                    >
                      {editPreview.starter.markdown}
                    </pre>
                  )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {mode === "templates" && (
        <div className="mx-auto grid w-full max-w-[1680px] grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 lg:px-8 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Template editor</h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Subject, html, text, and markdown starter templates.
                </p>
              </div>
              <select
                value={activeTemplateType}
                onChange={(event) => {
                  const next = event.target.value as NewsletterType;
                  setActiveTemplateType(next);
                  if (templates) setTemplateDraft(templates[next] || null);
                  else setTemplateDraft(null);
                  setTemplatePreview(null);
                }}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold dark:border-neutral-700 dark:bg-neutral-950"
              >
                {NEWSLETTER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {templateDraft && (
              <div className="mt-4 space-y-3">
                <label className="space-y-1">
                  <span className="text-sm font-semibold">Subject template</span>
                  <input
                    ref={templateSubjectRef}
                    value={templateDraft.subjectTemplate}
                    onFocus={() => setFocusedTemplateField("subjectTemplate")}
                    onChange={(event) =>
                      setTemplateDraft((current) => (current ? { ...current, subjectTemplate: event.target.value } : current))
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold">HTML template</span>
                  <textarea
                    ref={templateHtmlRef}
                    rows={7}
                    value={templateDraft.htmlTemplate}
                    onFocus={() => setFocusedTemplateField("htmlTemplate")}
                    onChange={(event) =>
                      setTemplateDraft((current) => (current ? { ...current, htmlTemplate: event.target.value } : current))
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold">Text template</span>
                  <textarea
                    ref={templateTextRef}
                    rows={7}
                    value={templateDraft.textTemplate}
                    onFocus={() => setFocusedTemplateField("textTemplate")}
                    onChange={(event) =>
                      setTemplateDraft((current) => (current ? { ...current, textTemplate: event.target.value } : current))
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-semibold">Markdown template</span>
                  <textarea
                    ref={templateMarkdownRef}
                    rows={10}
                    value={templateDraft.markdownTemplate}
                    onFocus={() => setFocusedTemplateField("markdownTemplate")}
                    onChange={(event) =>
                      setTemplateDraft((current) => (current ? { ...current, markdownTemplate: event.target.value } : current))
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  {templateInsertablePlaceholders.map((placeholder) => (
                    <button
                      key={placeholder}
                      type="button"
                      onClick={() => insertTemplateToken(placeholder)}
                      className="rounded-full border px-3 py-1 text-xs"
                    >
                      {`{{${placeholder}}}`}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveTemplate}
                    disabled={saving || !templateIsDirty}
                    className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={renderTemplatePreview}
                    disabled={saving}
                    className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Preview
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 lg:px-8 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Template preview</h2>
                <SegmentedControl<PreviewTab>
                  value={templatePreviewTab}
                  onChange={setTemplatePreviewTab}
                  options={[
                    { value: "subject", label: "Subject" },
                    { value: "html", label: "HTML" },
                    { value: "text", label: "Text" },
                    { value: "starter", label: "Starter" },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-sm font-semibold">Preview subject</span>
                  <input
                    type="text"
                    value={templatePreviewContext.campaignSubject}
                    onChange={(event) =>
                      setTemplatePreviewContext((current) => ({ ...current, campaignSubject: event.target.value }))
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold">Summary timeframe</span>
                  <select
                    value={templatePreviewContext.timeframePreset}
                    onChange={(event) => setTemplateSummaryPreset(event.target.value as NewsletterSummaryTimeframePreset)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-semibold">Minimum relevance</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={templatePreviewContext.minimumRelevance}
                    onChange={(event) =>
                      setTemplatePreviewContext((current) => ({
                        ...current,
                        minimumRelevance: Number(event.target.value) || 1,
                      }))
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  />
                </label>
                {templatePreviewContext.timeframePreset === "custom" && (
                  <label className="space-y-1 sm:col-span-2 xl:col-span-1">
                    <span className="text-sm font-semibold">Period (days)</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={templatePreviewContext.periodDays}
                      onChange={(event) =>
                        setTemplatePreviewContext((current) => ({
                          ...current,
                          periodDays: Number(event.target.value) || 7,
                        }))
                      }
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                    />
                  </label>
                )}
              </div>

              {!templatePreview && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-950">
                  Render a preview to inspect template output.
                </div>
              )}

              {templatePreview && templatePreviewTab === "subject" && (
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="text-sm font-semibold">{templatePreview.rendered.subject}</div>
                </div>
              )}

              {templatePreview && templatePreviewTab === "html" && <HtmlPreviewFrame html={templatePreview.rendered.html} />}

              {templatePreview && templatePreviewTab === "text" && (
                <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-5 text-xs dark:border-neutral-800 dark:bg-neutral-950">
                  {templatePreview.rendered.text}
                </pre>
              )}

              {templatePreview && templatePreviewTab === "starter" && (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-5 text-xs dark:border-neutral-800 dark:bg-neutral-950">
                    {templatePreview.starter.markdown}
                  </pre>
                  <div className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-7 dark:border-neutral-800 dark:bg-neutral-950">
                    <div className={`prose prose-sm dark:prose-invert sm:prose-base ${NEWSLETTER_STARTER_RENDERED_PANEL_CLASSNAME}`}>
                      <ReactMarkdown components={newsletterStarterMarkdownComponents}>
                        {templatePreview.starter.markdown}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
