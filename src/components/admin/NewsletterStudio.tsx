"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminFetch, getAdminApiKey } from "@/lib/admin-utils";
import { ErrorAlert } from "@/components/admin/ActionButtons";

interface NewsletterCampaign {
  id: string;
  newsletterType: "news" | "jobs" | "candidates";
  subject: string;
  previewText: string | null;
  periodDays: number;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledAt: string | null;
  sentAt: string | null;
  failureReason: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface NewsletterTemplate {
  newsletterType: "news" | "jobs" | "candidates";
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string;
}

interface TemplatePreviewContextDigestItem {
  title: string;
  subtitle?: string;
  url?: string;
  currentViews?: number;
  delta?: number;
}

interface TemplatePreviewContext {
  digest: {
    heading: string;
    summary: string;
    periodDays: number;
    totalViews?: number;
    deltaViews?: number;
    items: TemplatePreviewContextDigestItem[];
  };
  recentNews: Array<{
    title: string;
    url: string;
    date: string;
    type: string;
    source: string;
  }>;
}

interface TemplatePreview {
  placeholders: string[];
  template: NewsletterTemplate;
  rendered: {
    subject: string;
    html: string;
    text: string;
  };
  context: TemplatePreviewContext;
}

const NEWSLETTER_TYPES = ["news", "jobs", "candidates"] as const;
type NewsletterType = (typeof NEWSLETTER_TYPES)[number];

type Mode = "compose" | "queue" | "templates";

type PreviewTab = "html" | "text" | "subject";
type TemplateFieldKey = "subjectTemplate" | "htmlTemplate" | "textTemplate";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatStatus(status: NewsletterCampaign["status"]) {
  return status === "sending" ? "Sending" : status.charAt(0).toUpperCase() + status.slice(1);
}

function StatusPill({ status }: { status: NewsletterCampaign["status"] }) {
  const styles = {
    draft: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
    scheduled: "bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-500/25",
    sending: "bg-amber-50 text-amber-800 border border-amber-100 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/25",
    sent: "bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/25",
    failed: "bg-red-50 text-red-700 border border-red-100 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/25",
  }[status];

  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", styles)}>
      {formatStatus(status)}
    </span>
  );
}

function SegmentedControl<T extends string>(props: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; hint?: string }>;
}) {
  return (
    <div className="inline-flex rounded-full bg-neutral-100 p-1 dark:bg-neutral-800/80">
      {props.options.map((opt) => {
        const active = opt.value === props.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => props.onChange(opt.value)}
            className={cx(
              "relative rounded-full px-3 py-1.5 text-sm font-semibold transition",
              active
                ? "bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-950 dark:text-neutral-50 dark:ring-neutral-800"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            )}
            title={opt.hint}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function HtmlPreviewFrame({ html }: { html: string }) {
  const srcDoc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base target="_blank" />
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        padding: 18px;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        line-height: 1.45;
      }
      img { max-width: 100%; height: auto; }
      hr { border: none; border-top: 1px solid #e5e7eb; margin: 18px 0; }
      a { color: #4338ca; }
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
      className="h-[520px] w-full rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
      srcDoc={srcDoc}
    />
  );
}

function computeUtcWindow(periodDays: number, now: Date) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (periodDays - 1));
  start.setUTCHours(0, 0, 0, 0);
  return { start, end };
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function suggestedWeeklySubject(type: NewsletterType, periodDays: number) {
  const now = new Date();
  const { start, end } = computeUtcWindow(periodDays, now);
  const label = type === "news" ? "Weekly News Digest" : `${type[0].toUpperCase()}${type.slice(1)} Digest`;
  return `${label} (${isoDay(start)} to ${isoDay(end)})`;
}

export function NewsletterStudio() {
  const [mode, setMode] = useState<Mode>("compose");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [templates, setTemplates] = useState<Record<NewsletterType, NewsletterTemplate> | null>(null);

  const [campaignForm, setCampaignForm] = useState({
    newsletterType: "news" as NewsletterType,
    subject: "",
    previewText: "",
    periodDays: 7,
    scheduledAtLocal: "",
  });

  const [queueFilter, setQueueFilter] = useState<NewsletterCampaign["status"] | "all">("all");
  const [queueSearch, setQueueSearch] = useState("");
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});

  const [activeTemplateType, setActiveTemplateType] = useState<NewsletterType>("news");
  const [templateDraft, setTemplateDraft] = useState<NewsletterTemplate | null>(null);
  const [templatePreview, setTemplatePreview] = useState<TemplatePreview | null>(null);
  const [templatePreviewTab, setTemplatePreviewTab] = useState<PreviewTab>("html");
  const [templatePreviewContext, setTemplatePreviewContext] = useState({ periodDays: 7, campaignSubject: "Weekly News Digest" });
  const [focusedTemplateField, setFocusedTemplateField] = useState<TemplateFieldKey | null>(null);

  const subjectTemplateRef = useRef<HTMLInputElement | null>(null);
  const htmlTemplateRef = useRef<HTMLTextAreaElement | null>(null);
  const textTemplateRef = useRef<HTMLTextAreaElement | null>(null);
  const statusMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [composePreview, setComposePreview] = useState<TemplatePreview | null>(null);
  const [composePreviewTab, setComposePreviewTab] = useState<PreviewTab>("html");
  const [composePreviewLoading, setComposePreviewLoading] = useState(false);

  const refreshData = useCallback(async () => {
    setError(null);

    const headers = { "x-api-key": getAdminApiKey() };
    const [campaignsResult, templatesResult] = await Promise.all([
      adminFetch<NewsletterCampaign[]>("/api/v1/newsletter/campaigns?limit=100", { headers }),
      adminFetch<NewsletterTemplate[]>("/api/v1/newsletter/templates", { headers }),
    ]);

    if (campaignsResult.error) {
      setError(campaignsResult.error);
    } else {
      setCampaigns(campaignsResult.data || []);
    }

    if (templatesResult.error) {
      setError((prev) => prev || templatesResult.error);
    } else {
      const byType = Object.fromEntries(
        (templatesResult.data || []).map((item) => [item.newsletterType, item])
      ) as Record<NewsletterType, NewsletterTemplate>;
      setTemplates(byType);

      const current = byType[activeTemplateType];
      setTemplateDraft(current || null);
    }
  }, [activeTemplateType]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };

    load();
  }, [refreshData]);

  const sortedCampaigns = useMemo(() => {
    return [...campaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    const q = queueSearch.trim().toLowerCase();
    return sortedCampaigns.filter((c) => {
      if (queueFilter !== "all" && c.status !== queueFilter) return false;
      if (!q) return true;
      return c.subject.toLowerCase().includes(q) || c.newsletterType.toLowerCase().includes(q);
    });
  }, [queueFilter, queueSearch, sortedCampaigns]);

  const templateIsDirty = useMemo(() => {
    if (!templateDraft || !templates) return false;
    const original = templates[templateDraft.newsletterType];
    if (!original) return true;
    return (
      original.subjectTemplate !== templateDraft.subjectTemplate ||
      original.htmlTemplate !== templateDraft.htmlTemplate ||
      original.textTemplate !== templateDraft.textTemplate
    );
  }, [templateDraft, templates]);

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

  const handleTemplateTypeChange = (nextType: NewsletterType) => {
    setActiveTemplateType(nextType);
    if (templates) setTemplateDraft(templates[nextType] || null);
    else setTemplateDraft(null);
    setTemplatePreview(null);
    setTemplatePreviewTab("html");
  };

  const setStudioMode = (next: Mode) => {
    setMode(next);

    if (next === "templates") {
      setTemplatePreview(null);
      setTemplatePreviewTab("html");
    }
  };

  const createCampaign = async () => {
    if (!campaignForm.subject.trim()) {
      setError("Subject is required");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: createError } = await adminFetch("/api/v1/newsletter/campaigns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify({
        newsletterType: campaignForm.newsletterType,
        subject: campaignForm.subject,
        previewText: campaignForm.previewText || undefined,
        periodDays: campaignForm.periodDays,
        scheduledAt: campaignForm.scheduledAtLocal ? new Date(campaignForm.scheduledAtLocal).toISOString() : undefined,
        createdBy: "admin-news-studio",
      }),
    });

    setSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setCampaignForm((current) => ({ ...current, subject: "", previewText: "", scheduledAtLocal: "" }));
    setStatusMessage("Draft created");
    await refreshData();
    setMode("queue");
  };

  const autoCreateWeekly = async () => {
    setSaving(true);
    setError(null);

    const result = await adminFetch<{
      created: boolean;
      periodStart: string;
      periodEnd: string;
      campaign: NewsletterCampaign;
    }>("/api/v1/newsletter/campaigns/auto-create-weekly", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify({ periodDays: 7, createdBy: "admin-news-studio:auto" }),
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

  const sendNow = async (campaignId: string) => {
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

    setStatusMessage("Send started");
    await refreshData();
  };

  const scheduleCampaign = async (campaignId: string) => {
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

    setStatusMessage("Scheduled");
    await refreshData();
  };

  const saveTemplate = async () => {
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

    setSaving(true);
    setError(null);

    const result = await adminFetch<TemplatePreview>("/api/v1/newsletter/templates/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify({
        newsletterType: templateDraft.newsletterType,
        periodDays: templatePreviewContext.periodDays,
        campaignSubject: templatePreviewContext.campaignSubject,
        subjectTemplate: templateDraft.subjectTemplate,
        htmlTemplate: templateDraft.htmlTemplate,
        textTemplate: templateDraft.textTemplate,
      }),
    });

    setSaving(false);

    if (result.error || !result.data) {
      setError(result.error || "Unable to render preview");
      return;
    }

    setTemplatePreview(result.data);
  };

  const insertPlaceholderIntoTemplate = (placeholder: string) => {
    if (!templateDraft) return;
    const token = `{{${placeholder}}}`;

    const field: TemplateFieldKey = focusedTemplateField || "htmlTemplate";
    const currentValue = templateDraft[field] || "";

    const element: HTMLInputElement | HTMLTextAreaElement | null =
      field === "subjectTemplate"
        ? subjectTemplateRef.current
        : field === "htmlTemplate"
          ? htmlTemplateRef.current
          : textTemplateRef.current;

    const start = element?.selectionStart ?? currentValue.length;
    const end = element?.selectionEnd ?? start;

    const nextValue = currentValue.slice(0, start) + token + currentValue.slice(end);
    setTemplateDraft({ ...templateDraft, [field]: nextValue });

    requestAnimationFrame(() => {
      if (!element) return;
      element.focus();
      try {
        element.setSelectionRange(start + token.length, start + token.length);
      } catch {
        // ignore
      }
    });
  };

  const renderComposePreview = useCallback(async () => {
    if (getAdminApiKey() === "") return;

    setComposePreviewLoading(true);
    const subject = campaignForm.subject.trim()
      ? campaignForm.subject.trim()
      : suggestedWeeklySubject(campaignForm.newsletterType, campaignForm.periodDays);

    const result = await adminFetch<TemplatePreview>("/api/v1/newsletter/templates/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify({
        newsletterType: campaignForm.newsletterType,
        periodDays: campaignForm.periodDays,
        campaignSubject: subject,
      }),
    });

    setComposePreviewLoading(false);

    if (result.error || !result.data) {
      setError(result.error || "Unable to render preview");
      return;
    }

    setComposePreview(result.data);
  }, [campaignForm.newsletterType, campaignForm.periodDays, campaignForm.subject]);

  useEffect(() => {
    if (mode !== "compose") return;

    const handle = setTimeout(() => {
      void renderComposePreview();
    }, 280);

    return () => clearTimeout(handle);
  }, [mode, renderComposePreview]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        Loading newsletter studio...
      </div>
    );
  }

  const studioChromeBg =
    "bg-[radial-gradient(900px_circle_at_10%_-30%,rgba(79,70,229,0.12),transparent_45%),radial-gradient(800px_circle_at_90%_-20%,rgba(16,185,129,0.10),transparent_50%)]";

  return (
    <div className="space-y-4">
      {error && (
        <ErrorAlert
          message={error}
          onRetry={() => {
            setError(null);
            refreshData();
          }}
        />
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
          {message}
        </div>
      )}

      <section className={cx("rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900", studioChromeBg)}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-sm dark:bg-neutral-50 dark:text-neutral-900">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 6.5C4 5.11929 5.11929 4 6.5 4H18.5C19.8807 4 21 5.11929 21 6.5V17.5C21 18.8807 19.8807 20 18.5 20H6.5C5.11929 20 4 18.8807 4 17.5V6.5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path d="M7 8H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="text-base font-semibold text-neutral-900 dark:text-neutral-50">Studio</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-300">
                Compose drafts, manage the queue, and evolve templates.
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <SegmentedControl<Mode>
              value={mode}
              onChange={(next) => setStudioMode(next)}
              options={[
                { value: "compose", label: "Compose", hint: "Create new campaign drafts" },
                { value: "queue", label: "Queue", hint: "Schedule and send campaigns" },
                { value: "templates", label: "Templates", hint: "Edit templates and preview rendering" },
              ]}
            />

            <div className="flex items-center gap-2">
              {mode === "compose" && (
                <>
                  <button
                    type="button"
                    onClick={autoCreateWeekly}
                    disabled={saving || campaignForm.newsletterType !== "news"}
                    className={cx(
                      "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition shadow-sm",
                      campaignForm.newsletterType === "news"
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                        : "bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 cursor-not-allowed"
                    )}
                    title={campaignForm.newsletterType === "news" ? "Auto-create weekly news draft" : "Auto-create currently supports only the news newsletter"}
                  >
                    Generate weekly draft
                  </button>
                  <button
                    type="button"
                    onClick={() => void renderComposePreview()}
                    disabled={composePreviewLoading || saving}
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-900"
                  >
                    Refresh preview
                  </button>
                </>
              )}

              {mode === "queue" && (
                <button
                  type="button"
                  onClick={refreshData}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-900"
                >
                  Refresh
                </button>
              )}

              {mode === "templates" && (
                <>
                  <button
                    type="button"
                    onClick={saveTemplate}
                    disabled={saving || !templateDraft}
                    className={cx(
                      "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition shadow-sm disabled:opacity-50",
                      templateIsDirty ? "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-white" : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                    )}
                    title={templateIsDirty ? "Save template changes" : "No unsaved changes"}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={renderTemplatePreview}
                    disabled={saving || !templateDraft}
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-900"
                  >
                    Preview
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {mode === "compose" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Draft composer</h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Creates a campaign record. Content is rendered from the saved template at send time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCampaignForm((c) => ({ ...c, subject: suggestedWeeklySubject(c.newsletterType, c.periodDays) }))}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-900"
              >
                Use suggested subject
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Newsletter type</span>
                <select
                  value={campaignForm.newsletterType}
                  onChange={(event) => setCampaignForm((current) => ({ ...current, newsletterType: event.target.value as NewsletterType }))}
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
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Period (days)</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={campaignForm.periodDays}
                  onChange={(event) => setCampaignForm((current) => ({ ...current, periodDays: Number(event.target.value) || 7 }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Subject</span>
                <input
                  type="text"
                  value={campaignForm.subject}
                  onChange={(event) => setCampaignForm((current) => ({ ...current, subject: event.target.value }))}
                  placeholder={suggestedWeeklySubject(campaignForm.newsletterType, campaignForm.periodDays)}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Preview text (optional)</span>
                <input
                  type="text"
                  value={campaignForm.previewText}
                  onChange={(event) => setCampaignForm((current) => ({ ...current, previewText: event.target.value }))}
                  placeholder="Top updates from the last week"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Schedule (optional)</span>
                <input
                  type="datetime-local"
                  value={campaignForm.scheduledAtLocal}
                  onChange={(event) => setCampaignForm((current) => ({ ...current, scheduledAtLocal: event.target.value }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Stored as UTC when scheduled.
                </p>
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={createCampaign}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-white"
              >
                Create draft
              </button>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Tip: edit templates in the Templates tab, then come back to Compose.
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Live preview</h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Uses the saved template for <span className="font-semibold">{campaignForm.newsletterType}</span> and the latest digest snapshot.
                </p>
              </div>
              <SegmentedControl<PreviewTab>
                value={composePreviewTab}
                onChange={(v) => setComposePreviewTab(v)}
                options={[
                  { value: "html", label: "HTML" },
                  { value: "text", label: "Text" },
                  { value: "subject", label: "Subject" },
                ]}
              />
            </div>

            {composePreviewLoading && (
              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                Rendering preview...
              </div>
            )}

            {!composePreviewLoading && !composePreview && (
              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                Preview will appear here.
              </div>
            )}

            {composePreview && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Digest context
                  </div>
                  <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {composePreview.context.digest.heading}
                  </div>
                  <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {composePreview.context.digest.summary}
                  </div>
                </div>

                {composePreviewTab === "subject" && (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Rendered subject
                    </div>
                    <div className="mt-2 text-base font-semibold text-neutral-900 dark:text-neutral-50">
                      {composePreview.rendered.subject}
                    </div>
                    {campaignForm.previewText.trim() && (
                      <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                        <span className="font-semibold">Preview text:</span> {campaignForm.previewText.trim()}
                      </div>
                    )}
                  </div>
                )}

                {composePreviewTab === "html" && (
                  <div className="space-y-2">
                    {campaignForm.previewText.trim() && (
                      <div className="rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                        <span className="font-semibold">Preview text:</span> {campaignForm.previewText.trim()}
                      </div>
                    )}
                    <HtmlPreviewFrame html={composePreview.rendered.html} />
                  </div>
                )}

                {composePreviewTab === "text" && (
                  <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-4 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                    {composePreview.rendered.text}
                  </pre>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {mode === "queue" && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Campaign queue</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Schedule drafts, kick off sends, and monitor failures.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <SegmentedControl<typeof queueFilter>
                  value={queueFilter}
                  onChange={(v) => setQueueFilter(v)}
                  options={[
                    { value: "all", label: "All" },
                    { value: "draft", label: "Draft" },
                    { value: "scheduled", label: "Scheduled" },
                    { value: "sending", label: "Sending" },
                    { value: "sent", label: "Sent" },
                    { value: "failed", label: "Failed" },
                  ]}
                />
              </div>
              <input
                type="text"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder="Search subject..."
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 md:w-72"
              />
            </div>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-800 dark:bg-neutral-950">
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">No campaigns match this view.</div>
              <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Create a draft in Compose, then come back here to schedule or send.
              </div>
              <button
                type="button"
                onClick={() => setMode("compose")}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-white"
              >
                Go to Compose
              </button>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-950">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-t border-neutral-200 align-top dark:border-neutral-800">
                      <td className="px-4 py-3">
                        <StatusPill status={campaign.status} />
                        {campaign.failureReason && (
                          <div className="mt-2 text-xs text-red-700 dark:text-red-300">
                            {campaign.failureReason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize text-neutral-700 dark:text-neutral-200">{campaign.newsletterType}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-50">{campaign.subject}</div>
                        {campaign.previewText && <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{campaign.previewText}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-700 dark:text-neutral-200">
                        {new Date(campaign.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 min-w-80">
                        <div className="flex items-center gap-2">
                          <input
                            type="datetime-local"
                            value={scheduleDrafts[campaign.id] || ""}
                            onChange={(event) => setScheduleDrafts((current) => ({ ...current, [campaign.id]: event.target.value }))}
                            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                          />
                          <button
                            type="button"
                            onClick={() => scheduleCampaign(campaign.id)}
                            disabled={saving}
                            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-900"
                          >
                            Set
                          </button>
                        </div>
                        {campaign.scheduledAt && (
                          <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                            Current: {new Date(campaign.scheduledAt).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => sendNow(campaign.id)}
                          disabled={saving || campaign.status === "sent" || campaign.status === "sending"}
                          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Send now
                        </button>
                        {campaign.sentAt && (
                          <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                            Sent: {new Date(campaign.sentAt).toLocaleString()}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {mode === "templates" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Template editor</h2>
                  {templateIsDirty && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
                      Unsaved
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Templates render on send. Use placeholders like <code className="rounded bg-neutral-100 px-1 py-0.5 dark:bg-neutral-800">{`{{digest_heading}}`}</code>.
                </p>
              </div>

              <select
                value={activeTemplateType}
                onChange={(event) => handleTemplateTypeChange(event.target.value as NewsletterType)}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold dark:border-neutral-700 dark:bg-neutral-950"
              >
                {NEWSLETTER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {!templateDraft ? (
              <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                No template loaded for <span className="font-semibold">{activeTemplateType}</span>.
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-1 gap-4">
                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Subject template</span>
                    <input
                      ref={subjectTemplateRef}
                      type="text"
                      value={templateDraft.subjectTemplate}
                      onFocus={() => setFocusedTemplateField("subjectTemplate")}
                      onChange={(event) => setTemplateDraft((current) => (current ? { ...current, subjectTemplate: event.target.value } : current))}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">HTML template</span>
                    <textarea
                      ref={htmlTemplateRef}
                      rows={10}
                      value={templateDraft.htmlTemplate}
                      onFocus={() => setFocusedTemplateField("htmlTemplate")}
                      onChange={(event) => setTemplateDraft((current) => (current ? { ...current, htmlTemplate: event.target.value } : current))}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-950"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Text template</span>
                    <textarea
                      ref={textTemplateRef}
                      rows={10}
                      value={templateDraft.textTemplate}
                      onFocus={() => setFocusedTemplateField("textTemplate")}
                      onChange={(event) => setTemplateDraft((current) => (current ? { ...current, textTemplate: event.target.value } : current))}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-950"
                    />
                  </label>
                </div>

                <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Placeholders</div>
                      <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                        Click to insert into the focused field.
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Focus: <span className="font-semibold">{focusedTemplateField || "htmlTemplate"}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(templatePreview?.placeholders || [
                      "campaign_subject",
                      "campaign_type",
                      "period_days",
                      "digest_heading",
                      "digest_summary",
                      "total_views",
                      "delta_views",
                      "digest_items_html",
                      "digest_items_text",
                      "recent_news_html",
                      "recent_news_text",
                      "unsubscribe_url",
                      "preferences_url",
                      "default_html_body",
                      "default_text_body",
                      "generated_at_iso",
                    ]).map((ph) => (
                      <button
                        key={ph}
                        type="button"
                        onClick={() => insertPlaceholderIntoTemplate(ph)}
                        className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"
                      >
                        {`{{${ph}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Preview</h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Render the current draft template with a real digest snapshot.
                </p>
              </div>
              <SegmentedControl<PreviewTab>
                value={templatePreviewTab}
                onChange={(v) => setTemplatePreviewTab(v)}
                options={[
                  { value: "html", label: "HTML" },
                  { value: "text", label: "Text" },
                  { value: "subject", label: "Subject" },
                ]}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Preview subject</span>
                <input
                  type="text"
                  value={templatePreviewContext.campaignSubject}
                  onChange={(e) => setTemplatePreviewContext((c) => ({ ...c, campaignSubject: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Period (days)</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={templatePreviewContext.periodDays}
                  onChange={(e) => setTemplatePreviewContext((c) => ({ ...c, periodDays: Number(e.target.value) || 7 }))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>
            </div>

            {!templatePreview && (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                Click <span className="font-semibold">Preview</span> in the top bar to render.
              </div>
            )}

            {templatePreview && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Context
                  </div>
                  <div className="mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {templatePreview.context.digest.heading}
                  </div>
                  <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {templatePreview.context.digest.summary}
                  </div>
                </div>

                {templatePreviewTab === "subject" && (
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Rendered subject
                    </div>
                    <div className="mt-2 text-base font-semibold text-neutral-900 dark:text-neutral-50">
                      {templatePreview.rendered.subject}
                    </div>
                  </div>
                )}

                {templatePreviewTab === "html" && <HtmlPreviewFrame html={templatePreview.rendered.html} />}

                {templatePreviewTab === "text" && (
                  <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-neutral-200 bg-white p-4 text-xs text-neutral-800 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                    {templatePreview.rendered.text}
                  </pre>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
