"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

interface TemplatePreview {
  placeholders: string[];
  rendered: {
    subject: string;
    html: string;
    text: string;
  };
}

const NEWSLETTER_TYPES = ["news", "jobs", "candidates"] as const;

type NewsletterType = (typeof NEWSLETTER_TYPES)[number];

export function NewsletterStudio() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [templates, setTemplates] = useState<Record<NewsletterType, NewsletterTemplate> | null>(null);
  const [activeTemplateType, setActiveTemplateType] = useState<NewsletterType>("news");

  const [campaignForm, setCampaignForm] = useState({
    newsletterType: "news" as NewsletterType,
    subject: "",
    previewText: "",
    periodDays: 7,
    scheduledAtLocal: "",
  });

  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});
  const [templateDraft, setTemplateDraft] = useState<NewsletterTemplate | null>(null);
  const [templatePreview, setTemplatePreview] = useState<TemplatePreview | null>(null);

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
      setTemplateDraft(byType[activeTemplateType]);
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
    return [...campaigns].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [campaigns]);

  const setStatusMessage = (value: string) => {
    setMessage(value);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleTemplateTypeChange = (nextType: NewsletterType) => {
    setActiveTemplateType(nextType);
    if (templates) {
      setTemplateDraft(templates[nextType]);
    } else {
      setTemplateDraft(null);
    }
    setTemplatePreview(null);
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
        scheduledAt: campaignForm.scheduledAtLocal
          ? new Date(campaignForm.scheduledAtLocal).toISOString()
          : undefined,
        createdBy: "admin-news-studio",
      }),
    });

    setSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setCampaignForm((current) => ({ ...current, subject: "", previewText: "", scheduledAtLocal: "" }));
    setStatusMessage("Campaign issue created");
    await refreshData();
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
        ? `Created weekly issue for ${result.data.periodStart} to ${result.data.periodEnd}`
        : `Weekly issue already exists for ${result.data.periodStart} to ${result.data.periodEnd}`
    );

    await refreshData();
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

    setStatusMessage("Campaign send started");
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

    setStatusMessage("Campaign scheduled");
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
        periodDays: campaignForm.periodDays,
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

  if (loading) {
    return <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">Loading newsletter studio...</div>;
  }

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} onRetry={() => { setError(null); refreshData(); }} />}
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
          {message}
        </div>
      )}

      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Issue Composer</h2>
          <button
            type="button"
            onClick={autoCreateWeekly}
            disabled={saving}
            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50"
          >
            Create This Week&apos;s Issue
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm font-medium">Newsletter Type</span>
            <select
              value={campaignForm.newsletterType}
              onChange={(event) => setCampaignForm((current) => ({ ...current, newsletterType: event.target.value as NewsletterType }))}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
            >
              {NEWSLETTER_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium">Period (days)</span>
            <input
              type="number"
              min={1}
              max={30}
              value={campaignForm.periodDays}
              onChange={(event) => setCampaignForm((current) => ({ ...current, periodDays: Number(event.target.value) || 7 }))}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium">Subject</span>
            <input
              type="text"
              value={campaignForm.subject}
              onChange={(event) => setCampaignForm((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Weekly News Digest"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium">Preview Text</span>
            <input
              type="text"
              value={campaignForm.previewText}
              onChange={(event) => setCampaignForm((current) => ({ ...current, previewText: event.target.value }))}
              placeholder="Top updates from the last week"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium">Schedule (optional)</span>
            <input
              type="datetime-local"
              value={campaignForm.scheduledAtLocal}
              onChange={(event) => setCampaignForm((current) => ({ ...current, scheduledAtLocal: event.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
            />
          </label>
        </div>

        <div>
          <button
            type="button"
            onClick={createCampaign}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-700 dark:bg-neutral-100 dark:hover:bg-neutral-300 text-white dark:text-neutral-900 text-sm font-medium disabled:opacity-50"
          >
            Create Campaign Issue
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Campaign Queue</h2>
          <span className="text-sm text-neutral-500">{campaigns.length} campaigns</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-left">
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3">Schedule</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCampaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-neutral-100 dark:border-neutral-800/60 align-top">
                  <td className="py-3 pr-3 capitalize">{campaign.newsletterType}</td>
                  <td className="py-3 pr-3 min-w-72">
                    <div className="font-medium">{campaign.subject}</div>
                    {campaign.previewText && <div className="text-neutral-500">{campaign.previewText}</div>}
                    {campaign.failureReason && <div className="text-red-600 dark:text-red-400">{campaign.failureReason}</div>}
                  </td>
                  <td className="py-3 pr-3 capitalize">{campaign.status}</td>
                  <td className="py-3 pr-3 whitespace-nowrap">{new Date(campaign.createdAt).toLocaleString()}</td>
                  <td className="py-3 pr-3 min-w-64">
                    <div className="flex items-center gap-2">
                      <input
                        type="datetime-local"
                        value={scheduleDrafts[campaign.id] || ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          setScheduleDrafts((current) => ({ ...current, [campaign.id]: value }));
                        }}
                        className="w-full px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                      />
                      <button
                        type="button"
                        onClick={() => scheduleCampaign(campaign.id)}
                        disabled={saving}
                        className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      >
                        Set
                      </button>
                    </div>
                    {campaign.scheduledAt && (
                      <div className="mt-1 text-neutral-500 text-xs">Current: {new Date(campaign.scheduledAt).toLocaleString()}</div>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => sendNow(campaign.id)}
                      disabled={saving || campaign.status === "sent" || campaign.status === "sending"}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                    >
                      Send Now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Template Editor</h2>
          <select
            value={activeTemplateType}
            onChange={(event) => handleTemplateTypeChange(event.target.value as NewsletterType)}
            className="px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
          >
            {NEWSLETTER_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {templateDraft && (
          <div className="grid grid-cols-1 gap-4">
            <label className="space-y-1">
              <span className="text-sm font-medium">Subject Template</span>
              <input
                type="text"
                value={templateDraft.subjectTemplate}
                onChange={(event) => {
                  const value = event.target.value;
                  setTemplateDraft((current) => current ? { ...current, subjectTemplate: value } : current);
                }}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">HTML Template</span>
              <textarea
                rows={7}
                value={templateDraft.htmlTemplate}
                onChange={(event) => {
                  const value = event.target.value;
                  setTemplateDraft((current) => current ? { ...current, htmlTemplate: value } : current);
                }}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-xs"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Text Template</span>
              <textarea
                rows={7}
                value={templateDraft.textTemplate}
                onChange={(event) => {
                  const value = event.target.value;
                  setTemplateDraft((current) => current ? { ...current, textTemplate: value } : current);
                }}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-xs"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveTemplate}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-700 dark:bg-neutral-100 dark:hover:bg-neutral-300 text-white dark:text-neutral-900 text-sm font-medium disabled:opacity-50"
              >
                Save Template
              </button>
              <button
                type="button"
                onClick={renderTemplatePreview}
                disabled={saving}
                className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-medium disabled:opacity-50"
              >
                Render Preview
              </button>
            </div>
          </div>
        )}

        {templatePreview && (
          <div className="space-y-3 rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
            <div>
              <h3 className="font-medium">Rendered Subject</h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{templatePreview.rendered.subject}</p>
            </div>
            <div>
              <h3 className="font-medium">Rendered HTML</h3>
              <div className="mt-2 rounded border border-neutral-200 dark:border-neutral-700 p-3 bg-white dark:bg-neutral-950" dangerouslySetInnerHTML={{ __html: templatePreview.rendered.html }} />
            </div>
            <div>
              <h3 className="font-medium">Rendered Text</h3>
              <pre className="mt-2 whitespace-pre-wrap rounded border border-neutral-200 dark:border-neutral-700 p-3 text-xs bg-white dark:bg-neutral-950">{templatePreview.rendered.text}</pre>
            </div>
            <div>
              <h3 className="font-medium">Available Placeholders</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {templatePreview.placeholders.map((placeholder) => (
                  <code key={placeholder} className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-xs">{`{{${placeholder}}}`}</code>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
