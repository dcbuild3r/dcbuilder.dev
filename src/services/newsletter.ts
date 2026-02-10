import { randomBytes } from "crypto";
import { and, desc, eq, gt, inArray, isNull, lte } from "drizzle-orm";
import {
  db,
  jobs,
  candidates,
  newsletterTemplates,
  newsletterSubscribers,
  newsletterPreferences,
  newsletterCampaigns,
  newsletterCampaignRecipients,
  newsletterSendEvents,
  newsletterUnsubTokens,
} from "@/db";
import {
  getCandidateViewsForWindow,
  getJobApplyClicksForWindow,
  getNewsClicksLast7Days,
} from "@/services/posthog";
import { getAllNews } from "@/lib/news";
import {
  NEWSLETTER_TYPES,
  type NewsletterType,
  dedupeNewsletterTypes,
  computeViewTotals,
} from "@/lib/newsletter-utils";

type SendResult = { success: true; messageId: string } | { success: false; error: string };

type DigestItem = {
  title: string;
  subtitle?: string;
  url?: string;
  currentViews?: number;
  delta?: number;
};

interface CampaignDigest {
  heading: string;
  summary: string;
  periodDays: number;
  totalViews?: number;
  deltaViews?: number;
  items: DigestItem[];
}

const DEFAULT_CAMPAIGN_PERIOD_DAYS = 7;

interface NewsletterTemplatePayload {
  newsletterType: NewsletterType;
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string;
}

export const NEWSLETTER_TEMPLATE_PLACEHOLDERS = [
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
] as const;

const DEFAULT_NEWSLETTER_TEMPLATES: Record<NewsletterType, NewsletterTemplatePayload> = {
  news: {
    newsletterType: "news",
    subjectTemplate: "{{campaign_subject}}",
    htmlTemplate: "{{default_html_body}}<hr /><h3>Recent News</h3><ul>{{recent_news_html}}</ul>",
    textTemplate: "{{default_text_body}}\n\nRecent News:\n{{recent_news_text}}",
  },
  jobs: {
    newsletterType: "jobs",
    subjectTemplate: "{{campaign_subject}}",
    htmlTemplate: "{{default_html_body}}",
    textTemplate: "{{default_text_body}}",
  },
  candidates: {
    newsletterType: "candidates",
    subjectTemplate: "{{campaign_subject}}",
    htmlTemplate: "{{default_html_body}}",
    textTemplate: "{{default_text_body}}",
  },
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://dcbuilder.dev";
}

function makeToken(): string {
  return randomBytes(24).toString("hex");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  const replyTo = process.env.NEWSLETTER_REPLY_TO;

  if (!apiKey || !from) {
    return { success: false, error: "Email provider not configured (RESEND_API_KEY or NEWSLETTER_FROM_EMAIL missing)" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { success: false, error: `Resend error ${response.status}: ${body}` };
    }

    const payload = await response.json() as { id?: string };
    return { success: true, messageId: payload.id || "unknown" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown email provider error" };
  }
}

async function upsertPreferences(subscriberId: string, enabledTypes: NewsletterType[]) {
  const now = new Date();
  const existing = await db
    .select()
    .from(newsletterPreferences)
    .where(eq(newsletterPreferences.subscriberId, subscriberId));

  const existingByType = new Map(existing.map((pref) => [pref.newsletterType, pref]));

  await Promise.all(
    NEWSLETTER_TYPES.map(async (type) => {
      const enabled = enabledTypes.includes(type);
      const found = existingByType.get(type);
      if (!found) {
        await db.insert(newsletterPreferences).values({
          subscriberId,
          newsletterType: type,
          enabled,
          createdAt: now,
          updatedAt: now,
        });
        return;
      }

      if (found.enabled !== enabled) {
        await db
          .update(newsletterPreferences)
          .set({ enabled, updatedAt: now })
          .where(eq(newsletterPreferences.id, found.id));
      }
    })
  );
}

async function createSubscriberToken(params: {
  subscriberId: string;
  tokenType: "confirm" | "unsubscribe" | "preferences";
  newsletterType?: NewsletterType;
  expiresInHours: number;
}) {
  const token = makeToken();
  const expiresAt = new Date(Date.now() + params.expiresInHours * 60 * 60 * 1000);

  await db.insert(newsletterUnsubTokens).values({
    subscriberId: params.subscriberId,
    newsletterType: params.newsletterType ?? null,
    tokenType: params.tokenType,
    token,
    expiresAt,
  });

  return token;
}

async function getValidToken(token: string, tokenType: "confirm" | "unsubscribe" | "preferences") {
  const now = new Date();
  const [record] = await db
    .select()
    .from(newsletterUnsubTokens)
    .where(
      and(
        eq(newsletterUnsubTokens.token, token),
        eq(newsletterUnsubTokens.tokenType, tokenType),
        isNull(newsletterUnsubTokens.usedAt),
        gt(newsletterUnsubTokens.expiresAt, now)
      )
    )
    .limit(1);

  return record;
}

export async function subscribeToNewsletters(input: {
  email: string;
  newsletterTypes: string[];
  source?: string;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  if (!validateEmail(normalizedEmail)) {
    return { ok: false as const, status: 400, error: "Invalid email address" };
  }

  const selectedTypes = dedupeNewsletterTypes(input.newsletterTypes);
  if (selectedTypes.length === 0) {
    return { ok: false as const, status: 400, error: "Select at least one newsletter type" };
  }

  const now = new Date();
  const [existing] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, normalizedEmail))
    .limit(1);

  let subscriberId: string;
  if (existing) {
    subscriberId = existing.id;
    await db
      .update(newsletterSubscribers)
      .set({
        status: "pending",
        source: input.source || existing.source,
        unsubscribedAt: null,
        updatedAt: now,
      })
      .where(eq(newsletterSubscribers.id, existing.id));
  } else {
    const [inserted] = await db
      .insert(newsletterSubscribers)
      .values({
        email: normalizedEmail,
        status: "pending",
        source: input.source || "news-page",
      })
      .returning();
    subscriberId = inserted.id;
  }

  await upsertPreferences(subscriberId, selectedTypes);

  const confirmToken = await createSubscriberToken({
    subscriberId,
    tokenType: "confirm",
    expiresInHours: 48,
  });
  const confirmUrl = `${getBaseUrl()}/api/v1/newsletter/confirm?token=${confirmToken}`;

  const subject = "Confirm your newsletter subscription";
  const html = `
    <h2>Confirm subscription</h2>
    <p>Please confirm your subscription for: <strong>${selectedTypes.join(", ")}</strong>.</p>
    <p><a href="${confirmUrl}">Click here to confirm</a></p>
    <p>This link expires in 48 hours.</p>
  `;
  const text = `Confirm your newsletter subscription (${selectedTypes.join(", ")}): ${confirmUrl}`;

  const emailResult = await sendEmail({ to: normalizedEmail, subject, html, text });
  if (!emailResult.success) {
    return { ok: false as const, status: 503, error: emailResult.error };
  }

  return { ok: true as const, message: "Confirmation email sent" };
}

export async function confirmNewsletterSubscription(token: string) {
  const record = await getValidToken(token, "confirm");
  if (!record) {
    return { ok: false as const, status: 400, error: "Token invalid or expired" };
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(newsletterSubscribers)
      .set({
        status: "active",
        confirmedAt: now,
        unsubscribedAt: null,
        updatedAt: now,
      })
      .where(eq(newsletterSubscribers.id, record.subscriberId));

    await tx
      .update(newsletterUnsubTokens)
      .set({ usedAt: now })
      .where(eq(newsletterUnsubTokens.id, record.id));
  });

  return { ok: true as const };
}

export async function getPreferenceContext(token: string) {
  const record = await getValidToken(token, "preferences");
  if (!record) {
    return { ok: false as const, status: 400, error: "Token invalid or expired" };
  }

  const [subscriber] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, record.subscriberId))
    .limit(1);

  if (!subscriber) {
    return { ok: false as const, status: 404, error: "Subscriber not found" };
  }

  const preferences = await db
    .select()
    .from(newsletterPreferences)
    .where(eq(newsletterPreferences.subscriberId, subscriber.id));

  return {
    ok: true as const,
    data: {
      email: subscriber.email,
      preferences: NEWSLETTER_TYPES.map((type) => ({
        type,
        enabled: preferences.find((pref) => pref.newsletterType === type)?.enabled ?? false,
      })),
    },
  };
}

export async function updatePreferencesByToken(token: string, newsletterTypes: string[]) {
  const record = await getValidToken(token, "preferences");
  if (!record) {
    return { ok: false as const, status: 400, error: "Token invalid or expired" };
  }

  const selected = dedupeNewsletterTypes(newsletterTypes);
  await upsertPreferences(record.subscriberId, selected);

  if (selected.length === 0) {
    await db
      .update(newsletterSubscribers)
      .set({
        status: "unsubscribed",
        unsubscribedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.id, record.subscriberId));
  } else {
    await db
      .update(newsletterSubscribers)
      .set({
        status: "active",
        unsubscribedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.id, record.subscriberId));
  }

  return { ok: true as const };
}

export async function unsubscribeByToken(token: string) {
  const record = await getValidToken(token, "unsubscribe");
  if (!record) {
    return { ok: false as const, status: 400, error: "Token invalid or expired" };
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    if (record.newsletterType) {
      await tx
        .update(newsletterPreferences)
        .set({ enabled: false, updatedAt: now })
        .where(
          and(
            eq(newsletterPreferences.subscriberId, record.subscriberId),
            eq(newsletterPreferences.newsletterType, record.newsletterType)
          )
        );
    } else {
      await tx
        .update(newsletterPreferences)
        .set({ enabled: false, updatedAt: now })
        .where(eq(newsletterPreferences.subscriberId, record.subscriberId));
    }

    const remainingEnabled = await tx
      .select()
      .from(newsletterPreferences)
      .where(
        and(
          eq(newsletterPreferences.subscriberId, record.subscriberId),
          eq(newsletterPreferences.enabled, true)
        )
      );

    await tx
      .update(newsletterSubscribers)
      .set({
        status: remainingEnabled.length > 0 ? "active" : "unsubscribed",
        unsubscribedAt: remainingEnabled.length > 0 ? null : now,
        updatedAt: now,
      })
      .where(eq(newsletterSubscribers.id, record.subscriberId));

    await tx
      .update(newsletterUnsubTokens)
      .set({ usedAt: now })
      .where(eq(newsletterUnsubTokens.id, record.id));
  });

  return { ok: true as const };
}

async function resolveRecipients(newsletterType: NewsletterType) {
  const [subscribers, preferences] = await Promise.all([
    db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, "active")),
    db
      .select()
      .from(newsletterPreferences)
      .where(
        and(
          eq(newsletterPreferences.newsletterType, newsletterType),
          eq(newsletterPreferences.enabled, true)
        )
      ),
  ]);

  const preferredSubscriberIds = new Set(preferences.map((pref) => pref.subscriberId));
  return subscribers.filter((subscriber) => preferredSubscriberIds.has(subscriber.id));
}

async function buildJobsDigest(periodDays: number): Promise<CampaignDigest> {
  const [currentResult, previousResult] = await Promise.all([
    getJobApplyClicksForWindow(periodDays, 0),
    getJobApplyClicksForWindow(periodDays, periodDays),
  ]);

  const currentRows = currentResult.success ? currentResult.data : [];
  const previousRows = previousResult.success ? previousResult.data : [];
  const previousMap = new Map(previousRows.map((row) => [row.id, row.count]));

  const currentTotal = currentRows.reduce((sum, row) => sum + row.count, 0);
  const previousTotal = previousRows.reduce((sum, row) => sum + row.count, 0);
  const totals = computeViewTotals(currentTotal, previousTotal);

  const jobIds = currentRows.slice(0, 10).map((row) => row.id);
  const jobsById = new Map<string, { title: string; company: string; link: string }>();
  if (jobIds.length > 0) {
    const dbJobs = await db
      .select({ id: jobs.id, title: jobs.title, company: jobs.company, link: jobs.link })
      .from(jobs)
      .where(inArray(jobs.id, jobIds));
    for (const job of dbJobs) {
      jobsById.set(job.id, { title: job.title, company: job.company, link: job.link });
    }
  }

  const items: DigestItem[] = currentRows.slice(0, 10).map((row) => {
    const job = jobsById.get(row.id);
    return {
      title: job ? job.title : `Job ${row.id}`,
      subtitle: job ? job.company : "Unknown company",
      url: job?.link,
      currentViews: row.count,
      delta: row.count - (previousMap.get(row.id) || 0),
    };
  });

  return {
    heading: "Jobs performance digest",
    summary: `Views and engagement updates for the last ${periodDays} days.`,
    periodDays,
    totalViews: totals.totalViews,
    deltaViews: totals.deltaViews,
    items,
  };
}

async function buildCandidatesDigest(periodDays: number): Promise<CampaignDigest> {
  const [currentResult, previousResult] = await Promise.all([
    getCandidateViewsForWindow(periodDays, 0),
    getCandidateViewsForWindow(periodDays, periodDays),
  ]);

  const currentRows = currentResult.success ? currentResult.data : [];
  const previousRows = previousResult.success ? previousResult.data : [];
  const previousMap = new Map(previousRows.map((row) => [row.id, row.count]));

  const currentTotal = currentRows.reduce((sum, row) => sum + row.count, 0);
  const previousTotal = previousRows.reduce((sum, row) => sum + row.count, 0);
  const totals = computeViewTotals(currentTotal, previousTotal);

  const candidateIds = currentRows.slice(0, 10).map((row) => row.id);
  const candidatesById = new Map<string, { name: string; title: string | null }>();
  if (candidateIds.length > 0) {
    const dbCandidates = await db
      .select({ id: candidates.id, name: candidates.name, title: candidates.title })
      .from(candidates)
      .where(inArray(candidates.id, candidateIds));
    for (const candidate of dbCandidates) {
      candidatesById.set(candidate.id, { name: candidate.name, title: candidate.title });
    }
  }

  const items: DigestItem[] = currentRows.slice(0, 10).map((row) => {
    const candidate = candidatesById.get(row.id);
    return {
      title: candidate ? candidate.name : `Candidate ${row.id}`,
      subtitle: candidate?.title || undefined,
      currentViews: row.count,
      delta: row.count - (previousMap.get(row.id) || 0),
    };
  });

  return {
    heading: "Candidates performance digest",
    summary: `Candidate profile views for the last ${periodDays} days.`,
    periodDays,
    totalViews: totals.totalViews,
    deltaViews: totals.deltaViews,
    items,
  };
}

async function buildNewsDigest(periodDays: number): Promise<CampaignDigest> {
  const cutoff = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const [allNews, clicksResult] = await Promise.all([getAllNews(), getNewsClicksLast7Days()]);
  const clickMap = new Map((clicksResult.success ? clicksResult.data : []).map((row) => [row.id, row.count]));

  const items: DigestItem[] = allNews
    .filter((item) => new Date(item.date) > cutoff)
    .slice(0, 10)
    .map((item) => ({
      title: item.title,
      subtitle: item.source || item.company || item.type,
      url: item.url,
      currentViews: clickMap.get(item.id) || 0,
    }));

  return {
    heading: "News digest",
    summary: `Recent highlights from the last ${periodDays} days.`,
    periodDays,
    items,
  };
}

async function buildDigest(newsletterType: NewsletterType, periodDays: number): Promise<CampaignDigest> {
  if (newsletterType === "jobs") {
    return buildJobsDigest(periodDays);
  }
  if (newsletterType === "candidates") {
    return buildCandidatesDigest(periodDays);
  }
  return buildNewsDigest(periodDays);
}

function renderDigestItemsHtml(digest: CampaignDigest) {
  return digest.items.length
    ? digest.items.map((item) => {
      const metric = item.currentViews !== undefined
        ? `${item.currentViews} views${item.delta !== undefined ? ` (${item.delta >= 0 ? "+" : ""}${item.delta})` : ""}`
        : "";
      const line = [
        `<strong>${escapeHtml(item.title)}</strong>`,
        item.subtitle ? `<span>${escapeHtml(item.subtitle)}</span>` : "",
        metric ? `<span>${escapeHtml(metric)}</span>` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      if (item.url) {
        return `<li><a href="${item.url}">${line}</a></li>`;
      }
      return `<li>${line}</li>`;
    }).join("")
    : "<li>No items available for this period.</li>";
}

function renderDigestItemsText(digest: CampaignDigest) {
  return digest.items.length > 0
    ? digest.items.map((item) => {
      const metric = item.currentViews !== undefined
        ? `${item.currentViews} views${item.delta !== undefined ? ` (${item.delta >= 0 ? "+" : ""}${item.delta})` : ""}`
        : "";
      const parts = [item.title, item.subtitle, metric, item.url].filter(Boolean);
      return `- ${parts.join(" | ")}`;
    }).join("\n")
    : "- No items available for this period.";
}

function renderDigestHtml(digest: CampaignDigest, links: { unsubscribe: string; preferences: string }) {
  const itemsHtml = renderDigestItemsHtml(digest);
  const totals = digest.totalViews !== undefined
    ? `<p><strong>Total views:</strong> ${digest.totalViews}${digest.deltaViews !== undefined ? ` (${digest.deltaViews >= 0 ? "+" : ""}${digest.deltaViews} vs previous period)` : ""}</p>`
    : "";

  return `
    <h2>${escapeHtml(digest.heading)}</h2>
    <p>${escapeHtml(digest.summary)}</p>
    ${totals}
    <ul>${itemsHtml}</ul>
    <hr />
    <p><a href="${links.preferences}">Manage preferences</a> · <a href="${links.unsubscribe}">Unsubscribe</a></p>
  `;
}

function renderDigestText(digest: CampaignDigest, links: { unsubscribe: string; preferences: string }) {
  const totals = digest.totalViews !== undefined
    ? `Total views: ${digest.totalViews}${digest.deltaViews !== undefined ? ` (${digest.deltaViews >= 0 ? "+" : ""}${digest.deltaViews} vs previous period)` : ""}\n`
    : "";

  return `${digest.heading}\n${digest.summary}\n${totals}${renderDigestItemsText(digest)}\n\nManage preferences: ${links.preferences}\nUnsubscribe: ${links.unsubscribe}`;
}

function interpolateTemplate(template: string, values: Record<string, string>) {
  return template.replace(/{{\s*([a-z0-9_]+)\s*}}/gi, (_, key: string) => values[key] ?? "");
}

async function getRecentNewsSnapshot(limit: number = 8) {
  const allNews = await getAllNews();
  return allNews.slice(0, limit).map((item) => ({
    title: item.title,
    url: item.url,
    date: item.date,
    type: item.type,
    source: item.source || item.company || item.type,
  }));
}

function renderRecentNewsHtml(recentNews: Awaited<ReturnType<typeof getRecentNewsSnapshot>>) {
  return recentNews.length > 0
    ? recentNews.map((item) => (
      `<li><a href="${item.url}"><strong>${escapeHtml(item.title)}</strong></a> · ${escapeHtml(item.source)} · ${escapeHtml(item.date)}</li>`
    )).join("")
    : "<li>No recent news available.</li>";
}

function renderRecentNewsText(recentNews: Awaited<ReturnType<typeof getRecentNewsSnapshot>>) {
  return recentNews.length > 0
    ? recentNews.map((item) => `- ${item.title} | ${item.source} | ${item.date} | ${item.url}`).join("\n")
    : "- No recent news available.";
}

async function getNewsletterTemplatePayload(newsletterType: NewsletterType): Promise<NewsletterTemplatePayload> {
  const [stored] = await db
    .select()
    .from(newsletterTemplates)
    .where(eq(newsletterTemplates.newsletterType, newsletterType))
    .limit(1);

  if (!stored) {
    return DEFAULT_NEWSLETTER_TEMPLATES[newsletterType];
  }

  return {
    newsletterType,
    subjectTemplate: stored.subjectTemplate,
    htmlTemplate: stored.htmlTemplate,
    textTemplate: stored.textTemplate,
  };
}

function renderTemplateContent(params: {
  template: NewsletterTemplatePayload;
  campaignSubject: string;
  campaignType: NewsletterType;
  periodDays: number;
  digest: CampaignDigest;
  links: { unsubscribe: string; preferences: string };
  recentNews: Awaited<ReturnType<typeof getRecentNewsSnapshot>>;
  now?: Date;
}) {
  const now = params.now || new Date();
  const defaultHtmlBody = renderDigestHtml(params.digest, params.links);
  const defaultTextBody = renderDigestText(params.digest, params.links);
  const values: Record<string, string> = {
    campaign_subject: params.campaignSubject,
    campaign_type: params.campaignType,
    period_days: String(params.periodDays),
    digest_heading: params.digest.heading,
    digest_summary: params.digest.summary,
    total_views: params.digest.totalViews !== undefined ? String(params.digest.totalViews) : "",
    delta_views: params.digest.deltaViews !== undefined ? String(params.digest.deltaViews) : "",
    digest_items_html: renderDigestItemsHtml(params.digest),
    digest_items_text: renderDigestItemsText(params.digest),
    recent_news_html: renderRecentNewsHtml(params.recentNews),
    recent_news_text: renderRecentNewsText(params.recentNews),
    unsubscribe_url: params.links.unsubscribe,
    preferences_url: params.links.preferences,
    default_html_body: defaultHtmlBody,
    default_text_body: defaultTextBody,
    generated_at_iso: now.toISOString(),
  };

  const renderedSubject = interpolateTemplate(params.template.subjectTemplate, values).trim();
  const renderedHtml = interpolateTemplate(params.template.htmlTemplate, values).trim();
  const renderedText = interpolateTemplate(params.template.textTemplate, values).trim();

  return {
    subject: renderedSubject || params.campaignSubject,
    html: renderedHtml || defaultHtmlBody,
    text: renderedText || defaultTextBody,
  };
}

export async function listNewsletterTemplates() {
  const templates = await db.select().from(newsletterTemplates);
  const byType = new Map(templates.map((template) => [template.newsletterType, template]));

  return NEWSLETTER_TYPES.map((type) => {
    const stored = byType.get(type);
    if (!stored) {
      return DEFAULT_NEWSLETTER_TEMPLATES[type];
    }
    return {
      newsletterType: type,
      subjectTemplate: stored.subjectTemplate,
      htmlTemplate: stored.htmlTemplate,
      textTemplate: stored.textTemplate,
    };
  });
}

export async function upsertNewsletterTemplate(input: {
  newsletterType: string;
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string;
}) {
  if (!NEWSLETTER_TYPES.includes(input.newsletterType as NewsletterType)) {
    return { ok: false as const, status: 400, error: "Invalid newsletter type" };
  }
  if (!input.subjectTemplate.trim() || !input.htmlTemplate.trim() || !input.textTemplate.trim()) {
    return { ok: false as const, status: 400, error: "All template fields are required" };
  }

  const newsletterType = input.newsletterType as NewsletterType;
  const [existing] = await db
    .select()
    .from(newsletterTemplates)
    .where(eq(newsletterTemplates.newsletterType, newsletterType))
    .limit(1);

  if (!existing) {
    const [created] = await db
      .insert(newsletterTemplates)
      .values({
        newsletterType,
        subjectTemplate: input.subjectTemplate,
        htmlTemplate: input.htmlTemplate,
        textTemplate: input.textTemplate,
      })
      .returning();

    return { ok: true as const, data: created };
  }

  const [updated] = await db
    .update(newsletterTemplates)
    .set({
      subjectTemplate: input.subjectTemplate,
      htmlTemplate: input.htmlTemplate,
      textTemplate: input.textTemplate,
      updatedAt: new Date(),
    })
    .where(eq(newsletterTemplates.id, existing.id))
    .returning();

  return { ok: true as const, data: updated };
}

export async function renderNewsletterTemplatePreview(input: {
  newsletterType: string;
  periodDays?: number;
  campaignSubject?: string;
  subjectTemplate?: string;
  htmlTemplate?: string;
  textTemplate?: string;
}) {
  if (!NEWSLETTER_TYPES.includes(input.newsletterType as NewsletterType)) {
    return { ok: false as const, status: 400, error: "Invalid newsletter type" };
  }

  const newsletterType = input.newsletterType as NewsletterType;
  const periodDays = Number.isInteger(input.periodDays) && input.periodDays! > 0
    ? Math.min(input.periodDays!, 30)
    : DEFAULT_CAMPAIGN_PERIOD_DAYS;
  const digest = await buildDigest(newsletterType, periodDays);
  const recentNews = await getRecentNewsSnapshot(8);
  const storedTemplate = await getNewsletterTemplatePayload(newsletterType);
  const template: NewsletterTemplatePayload = {
    newsletterType,
    subjectTemplate: input.subjectTemplate ?? storedTemplate.subjectTemplate,
    htmlTemplate: input.htmlTemplate ?? storedTemplate.htmlTemplate,
    textTemplate: input.textTemplate ?? storedTemplate.textTemplate,
  };

  const rendered = renderTemplateContent({
    template,
    campaignSubject: input.campaignSubject?.trim()
      ? input.campaignSubject.trim()
      : `Preview: ${digest.heading}`,
    campaignType: newsletterType,
    periodDays,
    digest,
    links: {
      unsubscribe: "https://dcbuilder.dev/api/v1/newsletter/unsubscribe?token=preview-token",
      preferences: "https://dcbuilder.dev/api/v1/newsletter/preferences?token=preview-token",
    },
    recentNews,
    now: new Date(),
  });

  return {
    ok: true as const,
    data: {
      placeholders: [...NEWSLETTER_TEMPLATE_PLACEHOLDERS],
      template,
      rendered,
      context: {
        digest,
        recentNews,
      },
    },
  };
}

export async function listNewsletterCampaigns(limit: number = 50) {
  return db
    .select()
    .from(newsletterCampaigns)
    .orderBy(desc(newsletterCampaigns.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));
}

function formatUtcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function createWeeklyNewsCampaignIssue(input?: {
  periodDays?: number;
  createdBy?: string;
  scheduledAt?: string;
  now?: Date;
}) {
  const periodDays = Number.isInteger(input?.periodDays) && input!.periodDays! > 0
    ? Math.min(input!.periodDays!, 30)
    : DEFAULT_CAMPAIGN_PERIOD_DAYS;

  const now = input?.now || new Date();
  const periodEnd = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    23,
    59,
    59,
    999
  ));
  const periodStart = new Date(periodEnd);
  periodStart.setUTCDate(periodStart.getUTCDate() - (periodDays - 1));
  periodStart.setUTCHours(0, 0, 0, 0);

  const subject = `Weekly News Digest (${formatUtcDay(periodStart)} to ${formatUtcDay(periodEnd)})`;
  const previewText = `Top updates from the last ${periodDays} days`;

  const [existing] = await db
    .select()
    .from(newsletterCampaigns)
    .where(
      and(
        eq(newsletterCampaigns.newsletterType, "news"),
        eq(newsletterCampaigns.subject, subject)
      )
    )
    .limit(1);

  if (existing) {
    return {
      ok: true as const,
      data: {
        created: false,
        periodStart: formatUtcDay(periodStart),
        periodEnd: formatUtcDay(periodEnd),
        campaign: existing,
      },
    };
  }

  const created = await createNewsletterCampaign({
    newsletterType: "news",
    subject,
    previewText,
    periodDays,
    scheduledAt: input?.scheduledAt,
    createdBy: input?.createdBy,
  });

  if (!created.ok) {
    return created;
  }

  return {
    ok: true as const,
    data: {
      created: true,
      periodStart: formatUtcDay(periodStart),
      periodEnd: formatUtcDay(periodEnd),
      campaign: created.data,
    },
  };
}

export async function createNewsletterCampaign(input: {
  newsletterType: string;
  subject: string;
  previewText?: string;
  periodDays?: number;
  scheduledAt?: string;
  createdBy?: string;
}) {
  if (!NEWSLETTER_TYPES.includes(input.newsletterType as NewsletterType)) {
    return { ok: false as const, status: 400, error: "Invalid newsletter type" };
  }
  if (!input.subject?.trim()) {
    return { ok: false as const, status: 400, error: "Subject is required" };
  }

  const periodDays = Number.isInteger(input.periodDays) && input.periodDays! > 0
    ? Math.min(input.periodDays!, 30)
    : DEFAULT_CAMPAIGN_PERIOD_DAYS;

  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    return { ok: false as const, status: 400, error: "Invalid scheduledAt value" };
  }

  const [campaign] = await db
    .insert(newsletterCampaigns)
    .values({
      newsletterType: input.newsletterType as NewsletterType,
      subject: input.subject.trim(),
      previewText: input.previewText || null,
      periodDays,
      status: scheduledAt ? "scheduled" : "draft",
      scheduledAt,
      createdBy: input.createdBy || null,
    })
    .returning();

  return { ok: true as const, data: campaign };
}

export async function scheduleNewsletterCampaign(campaignId: string, scheduledAtIso: string) {
  const scheduledAt = new Date(scheduledAtIso);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { ok: false as const, status: 400, error: "Invalid scheduledAt value" };
  }

  const [campaign] = await db
    .update(newsletterCampaigns)
    .set({
      status: "scheduled",
      scheduledAt,
      updatedAt: new Date(),
    })
    .where(eq(newsletterCampaigns.id, campaignId))
    .returning();

  if (!campaign) {
    return { ok: false as const, status: 404, error: "Campaign not found" };
  }

  return { ok: true as const, data: campaign };
}

async function sendCampaignInternal(campaignId: string, force: boolean) {
  const [campaign] = await db
    .select()
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    return { ok: false as const, status: 404, error: "Campaign not found" };
  }
  if (campaign.status === "sent") {
    return { ok: true as const, data: { campaign, sent: 0, failed: 0, skipped: 0, alreadySent: true } };
  }
  if (campaign.status === "sending") {
    return { ok: false as const, status: 409, error: "Campaign is already being sent" };
  }
  if (!force && campaign.status === "scheduled" && campaign.scheduledAt && campaign.scheduledAt > new Date()) {
    return { ok: false as const, status: 409, error: "Campaign schedule is in the future" };
  }

  const recipients = await resolveRecipients(campaign.newsletterType as NewsletterType);
  if (recipients.length === 0) {
    return { ok: false as const, status: 409, error: "No active recipients for this campaign type" };
  }
  const activeRecipientIds = new Set(recipients.map((recipient) => recipient.id));

  const now = new Date();
  await db
    .update(newsletterCampaigns)
    .set({ status: "sending", failureReason: null, updatedAt: now })
    .where(eq(newsletterCampaigns.id, campaign.id));

  const existingRecipients = await db
    .select()
    .from(newsletterCampaignRecipients)
    .where(eq(newsletterCampaignRecipients.campaignId, campaign.id));
  const existingBySubscriber = new Map(existingRecipients.map((row) => [row.subscriberId, row]));

  const pendingRecipientRows = recipients.filter((recipient) => !existingBySubscriber.has(recipient.id));
  if (pendingRecipientRows.length > 0) {
    await db.insert(newsletterCampaignRecipients).values(
      pendingRecipientRows.map((recipient) => ({
        campaignId: campaign.id,
        subscriberId: recipient.id,
        email: recipient.email,
        status: "pending",
      }))
    );
  }

  const campaignRecipients = await db
    .select()
    .from(newsletterCampaignRecipients)
    .where(eq(newsletterCampaignRecipients.campaignId, campaign.id));

  const campaignType = campaign.newsletterType as NewsletterType;
  const periodDays = campaign.periodDays || DEFAULT_CAMPAIGN_PERIOD_DAYS;
  const [digest, templatePayload, recentNews] = await Promise.all([
    buildDigest(campaignType, periodDays),
    getNewsletterTemplatePayload(campaignType),
    getRecentNewsSnapshot(8),
  ]);
  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const recipient of campaignRecipients) {
    if (!activeRecipientIds.has(recipient.subscriberId)) {
      skippedCount += 1;
      if (recipient.status !== "skipped") {
        await db
          .update(newsletterCampaignRecipients)
          .set({
            status: "skipped",
            errorMessage: "Recipient no longer eligible (unsubscribed or preference disabled)",
            updatedAt: new Date(),
          })
          .where(eq(newsletterCampaignRecipients.id, recipient.id));
      }
      continue;
    }

    if (recipient.status === "sent") {
      skippedCount += 1;
      continue;
    }

    const unsubscribeToken = await createSubscriberToken({
      subscriberId: recipient.subscriberId,
      tokenType: "unsubscribe",
      newsletterType: campaign.newsletterType as NewsletterType,
      expiresInHours: 24 * 365,
    });
    const preferencesToken = await createSubscriberToken({
      subscriberId: recipient.subscriberId,
      tokenType: "preferences",
      expiresInHours: 24 * 365,
    });

    const links = {
      unsubscribe: `${getBaseUrl()}/api/v1/newsletter/unsubscribe?token=${unsubscribeToken}`,
      preferences: `${getBaseUrl()}/api/v1/newsletter/preferences?token=${preferencesToken}`,
    };
    const renderedTemplate = renderTemplateContent({
      template: templatePayload,
      campaignSubject: campaign.subject,
      campaignType,
      periodDays,
      digest,
      links,
      recentNews,
      now: new Date(),
    });

    const emailResult = await sendEmail({
      to: recipient.email,
      subject: renderedTemplate.subject,
      html: renderedTemplate.html,
      text: renderedTemplate.text,
    });

    if (emailResult.success) {
      sentCount += 1;
      await db.transaction(async (tx) => {
        await tx
          .update(newsletterCampaignRecipients)
          .set({ status: "sent", sentAt: new Date(), errorMessage: null, updatedAt: new Date() })
          .where(eq(newsletterCampaignRecipients.id, recipient.id));

        await tx.insert(newsletterSendEvents).values({
          campaignId: campaign.id,
          recipientId: recipient.id,
          eventType: "sent",
          provider: "resend",
          providerMessageId: emailResult.messageId,
          payload: JSON.stringify({ email: recipient.email }),
        });
      });
      continue;
    }

    failedCount += 1;
    await db.transaction(async (tx) => {
      await tx
        .update(newsletterCampaignRecipients)
        .set({ status: "failed", errorMessage: emailResult.error, updatedAt: new Date() })
        .where(eq(newsletterCampaignRecipients.id, recipient.id));

      await tx.insert(newsletterSendEvents).values({
        campaignId: campaign.id,
        recipientId: recipient.id,
        eventType: "failed",
        provider: "resend",
        payload: JSON.stringify({ email: recipient.email, error: emailResult.error }),
      });
    });
  }

  await db
    .update(newsletterCampaigns)
    .set({
      status: failedCount > 0 ? "failed" : "sent",
      sentAt: failedCount > 0 ? null : new Date(),
      failureReason: failedCount > 0 ? `${failedCount} recipients failed` : null,
      updatedAt: new Date(),
    })
    .where(eq(newsletterCampaigns.id, campaign.id));

  return {
    ok: true as const,
    data: {
      campaignId: campaign.id,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
      alreadySent: false,
    },
  };
}

export async function sendNewsletterCampaignNow(campaignId: string) {
  return sendCampaignInternal(campaignId, true);
}

export async function sendDueNewsletterCampaigns() {
  const now = new Date();
  const dueCampaigns = await db
    .select({ id: newsletterCampaigns.id })
    .from(newsletterCampaigns)
    .where(
      and(
        eq(newsletterCampaigns.status, "scheduled"),
        lte(newsletterCampaigns.scheduledAt, now),
        isNull(newsletterCampaigns.sentAt)
      )
    );

  const results = [];
  for (const campaign of dueCampaigns) {
    const result = await sendCampaignInternal(campaign.id, false);
    results.push({ campaignId: campaign.id, result });
  }

  return {
    ok: true as const,
    data: {
      processed: dueCampaigns.length,
      results,
    },
  };
}
