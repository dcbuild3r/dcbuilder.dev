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
  getNewsClicksForWindow,
} from "@/services/posthog";
import { getAllNews } from "@/lib/news";
import { categoryLabels, type NewsCategory } from "@/data/news";
import {
  NEWSLETTER_TYPES,
  NEWSLETTER_CONTENT_MODES,
  type NewsletterContentMode,
  type NewsletterType,
  dedupeNewsletterTypes,
  computeViewTotals,
  normalizeNewsletterContentMode,
} from "@/lib/newsletter-utils";
import { getRecommendedLinks, OTHER_CONTENT_I_LIKE } from "@/lib/recommendations";

type SendResult = { success: true; messageId: string } | { success: false; error: string };

export type DigestItem = {
  title: string;
  subtitle?: string;
  url?: string;
  currentViews?: number;
  delta?: number;
  category?: string;
};

export interface DigestGroup {
  category: string;
  label: string;
  items: DigestItem[];
}

interface CampaignDigest {
  heading: string;
  summary: string;
  periodDays: number;
  totalViews?: number;
  deltaViews?: number;
  items: DigestItem[];
  groups?: DigestGroup[];
}

const newsletterCategoryLabels: Partial<Record<NewsCategory, string>> = {
  x_post: "X Posts",
};

function newsletterLabel(cat: string): string {
  return newsletterCategoryLabels[cat as NewsCategory] || categoryLabels[cat as NewsCategory] || cat;
}

const NEWSLETTER_CATEGORY_ORDER: string[] = ["x_post", "general", "product", "cool_product"];

function sortGroupsByCategory<T extends { category?: string }>(groups: T[]): T[] {
  return [...groups].sort((a, b) => {
    const catA = a.category || "general";
    const catB = b.category || "general";
    const idxA = NEWSLETTER_CATEGORY_ORDER.indexOf(catA);
    const idxB = NEWSLETTER_CATEGORY_ORDER.indexOf(catB);
    const orderA = idxA >= 0 ? idxA : NEWSLETTER_CATEGORY_ORDER.length;
    const orderB = idxB >= 0 ? idxB : NEWSLETTER_CATEGORY_ORDER.length;
    if (orderA !== orderB) return orderA - orderB;
    return catA.localeCompare(catB);
  });
}

const DEFAULT_CAMPAIGN_PERIOD_DAYS = 7;

interface NewsletterTemplatePayload {
  newsletterType: NewsletterType;
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string;
  markdownTemplate: string;
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
  "digest_items_markdown",
  "recent_news_markdown",
  "unsubscribe_url",
  "preferences_url",
  "default_html_body",
  "default_text_body",
  "default_markdown_body",
  "generated_at_iso",
] as const;

const DEFAULT_NEWSLETTER_TEMPLATES: Record<NewsletterType, NewsletterTemplatePayload> = {
  news: {
    newsletterType: "news",
    subjectTemplate: "{{campaign_subject}}",
    htmlTemplate: "{{default_html_body}}",
    textTemplate: "{{default_text_body}}",
    markdownTemplate: "{{default_markdown_body}}",
  },
  jobs: {
    newsletterType: "jobs",
    subjectTemplate: "{{campaign_subject}}",
    htmlTemplate: "{{default_html_body}}",
    textTemplate: "{{default_text_body}}",
    markdownTemplate: "{{default_markdown_body}}",
  },
  candidates: {
    newsletterType: "candidates",
    subjectTemplate: "{{campaign_subject}}",
    htmlTemplate: "{{default_html_body}}",
    textTemplate: "{{default_text_body}}",
    markdownTemplate: "{{default_markdown_body}}",
  },
};

const LEGACY_NEWS_HTML_TEMPLATE = "{{default_html_body}}<hr /><h3>Recent News</h3><ul>{{recent_news_html}}</ul>";
const LEGACY_NEWS_TEXT_TEMPLATE = "{{default_text_body}}\n\nRecent News:\n{{recent_news_text}}";
const LEGACY_NEWS_MARKDOWN_TEMPLATE = `## {{digest_heading}}

{{digest_summary}}

{{digest_items_markdown}}

---

### Recent News

{{recent_news_markdown}}

[Manage preferences]({{preferences_url}}) | [Unsubscribe]({{unsubscribe_url}})`;

const SUBSTACK_SANS_FONT_STACK = "'SF Pro Display', -apple-system, system-ui, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'";
const MONO_FONT_STACK = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
const NEWSLETTER_AVATAR_URL = "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/dcbuilder.png";

const FEATURED_CATEGORIES: Array<{ key: string; label: string }> = [
  { key: "ethereum", label: "Ethereum" },
  { key: "ai", label: "AI" },
  { key: "crypto", label: "Crypto" },
  { key: "defi", label: "DeFi" },
  { key: "research", label: "Research" },
  { key: "infrastructure", label: "Infrastructure" },
  { key: "developer_tooling", label: "Dev Tooling" },
  { key: "product", label: "Product" },
];

const MUTABLE_CAMPAIGN_STATUSES = new Set(["draft", "scheduled"] as const);

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

function toAbsoluteUrl(url: string): string {
  try {
    return new URL(url, getBaseUrl()).toString();
  } catch {
    return url;
  }
}

function normalizeLegacyTemplatePayload(template: NewsletterTemplatePayload): NewsletterTemplatePayload {
  if (template.newsletterType !== "news") return template;
  return {
    ...template,
    htmlTemplate: template.htmlTemplate.trim() === LEGACY_NEWS_HTML_TEMPLATE
      ? "{{default_html_body}}"
      : template.htmlTemplate,
    textTemplate: template.textTemplate.trim() === LEGACY_NEWS_TEXT_TEMPLATE
      ? "{{default_text_body}}"
      : template.textTemplate,
    markdownTemplate: template.markdownTemplate.trim() === LEGACY_NEWS_MARKDOWN_TEMPLATE
      ? "{{default_markdown_body}}"
      : template.markdownTemplate,
  };
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
  const typeLabels: Record<string, string> = {
    news: "News Digest",
    jobs: "Jobs Updates",
    candidates: "Candidates Updates",
  };
  const formattedTypes = selectedTypes.map((t) => typeLabels[t] || t).join(", ");
  const html = `
    <div style="max-width:560px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#171717;line-height:1.6">
      <div style="padding:32px 0 20px">
        <div style="width:64px;height:64px;border-radius:50%;overflow:hidden">
          <img src="https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/dcbuilder.png" alt="dcbuilder.eth" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:cover" />
        </div>
      </div>
      <h2 style="font-size:22px;font-weight:700;margin:0 0 12px;color:#171717">One more step</h2>
      <p style="margin:0 0 28px;color:#525252;font-size:15px;line-height:1.5">
        Confirm your subscription to <strong style="color:#171717">${formattedTypes}</strong> and you'll start receiving updates from dcbuilder.eth.
      </p>
      <div style="margin:0 0 28px">
        <a href="${confirmUrl}" style="display:inline-block;background:#171717;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none">
          Confirm subscription
        </a>
      </div>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 16px" />
      <p style="margin:0;color:#a3a3a3;font-size:12px">
        This link expires in 48 hours. If you didn't subscribe, ignore this email.
      </p>
    </div>
  `;
  const text = `Confirm your subscription to dcbuilder.eth (${formattedTypes}): ${confirmUrl}\n\nThis link expires in 48 hours. If you didn't subscribe, you can safely ignore this email.`;

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

export async function adminUpdateSubscriberPreferences(subscriberId: string, newsletterTypes: string[]) {
  const [subscriber] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, subscriberId))
    .limit(1);

  if (!subscriber) {
    return { ok: false as const, status: 404, error: "Subscriber not found" };
  }

  const selected = dedupeNewsletterTypes(newsletterTypes);
  await upsertPreferences(subscriberId, selected);

  const now = new Date();
  const nextStatus =
    subscriber.status === "pending"
      ? "pending"
      : selected.length > 0
        ? "active"
        : "unsubscribed";
  const nextUnsubscribedAt =
    subscriber.status === "pending"
      ? subscriber.unsubscribedAt
      : selected.length > 0
        ? null
        : now;

  await db
    .update(newsletterSubscribers)
    .set({
      status: nextStatus,
      unsubscribedAt: nextUnsubscribedAt,
      updatedAt: now,
    })
    .where(eq(newsletterSubscribers.id, subscriberId));

  return {
    ok: true as const,
    data: {
      subscriber: {
        ...subscriber,
        status: nextStatus,
        unsubscribedAt: nextUnsubscribedAt,
        updatedAt: now,
      },
      preferences: NEWSLETTER_TYPES.map((newsletterType) => ({
        newsletterType,
        enabled: selected.includes(newsletterType),
      })),
    },
  };
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
  const [allNews, clicksResult] = await Promise.all([getAllNews(), getNewsClicksForWindow(periodDays, 0)]);
  const clickMap = new Map((clicksResult.success ? clicksResult.data : []).map((row) => [row.id, row.count]));

  const filtered = allNews.filter((item) => new Date(item.date) > cutoff);

  const items: DigestItem[] = filtered.slice(0, 20).map((item) => ({
    title: item.title,
    subtitle: item.description || item.source || item.company || item.type,
    url: item.url,
    currentViews: clickMap.get(item.id) || 0,
    category: item.category,
  }));

  const groupMap = new Map<string, DigestItem[]>();
  for (const item of items) {
    const cat = item.category || "general";
    if (!groupMap.has(cat)) groupMap.set(cat, []);
    groupMap.get(cat)!.push(item);
  }

  const groups: DigestGroup[] = sortGroupsByCategory(
    Array.from(groupMap.entries()).map(([cat, catItems]) => ({
      category: cat,
      label: newsletterLabel(cat),
      items: catItems,
    }))
  );

  return {
    heading: "News digest",
    summary: `Recent highlights from the last ${periodDays} days.`,
    periodDays,
    items,
    groups,
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
  const renderItem = (item: DigestItem) => {
    const metric = item.currentViews !== undefined
      ? `${item.currentViews} views${item.delta !== undefined ? ` (${item.delta >= 0 ? "+" : ""}${item.delta})` : ""}`
      : "";
    const title = item.url
      ? `<a href="${item.url}" style="color:#171717;text-decoration:underline;text-underline-offset:2px;text-decoration-color:#d4d4d4;font-weight:600;font-size:15px">${escapeHtml(item.title)}</a>`
      : `<strong style="font-size:15px">${escapeHtml(item.title)}</strong>`;
    const subtitle = item.subtitle
      ? `<div style="color:#525252;font-size:14px;margin-top:2px">${escapeHtml(item.subtitle)}</div>`
      : "";
    const metricHtml = metric
      ? `<div style="color:#a3a3a3;font-size:12px;margin-top:2px">${escapeHtml(metric)}</div>`
      : "";
    return `<li style="padding:10px 0;border-bottom:1px solid #f5f5f5">${title}${subtitle}${metricHtml}</li>`;
  };

  if (digest.groups && digest.groups.length > 0) {
    return digest.groups.map((group) => {
      const itemsHtml = group.items.map(renderItem).join("");
      return `<h3 style="font-size:15px;font-weight:700;color:#171717;margin:24px 0 8px;padding-bottom:8px;border-bottom:2px solid #171717">${escapeHtml(group.label)}</h3><ul style="list-style:none;padding:0;margin:0">${itemsHtml}</ul>`;
    }).join("");
  }

  return digest.items.length
    ? digest.items.map(renderItem).join("")
    : `<li style="padding:8px 0;color:#a3a3a3">No items available for this period.</li>`;
}

function renderDigestItemsText(digest: CampaignDigest) {
  if (digest.groups && digest.groups.length > 0) {
    return digest.groups.map((group) => {
      const header = `\n## ${group.label}`;
      const items = group.items.map((item) => {
        const metric = item.currentViews !== undefined
          ? `${item.currentViews} views${item.delta !== undefined ? ` (${item.delta >= 0 ? "+" : ""}${item.delta})` : ""}`
          : "";
        const parts = [item.title, item.subtitle, metric, item.url].filter(Boolean);
        return `- ${parts.join(" | ")}`;
      }).join("\n");
      return `${header}\n${items}`;
    }).join("\n");
  }

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

function renderWantMoreHtml() {
  const baseUrl = getBaseUrl();
  const newslettersHtml = getRecommendedLinks({ includeNewsletterExtras: true }).map((nl) =>
    `<li style="padding:6px 0"><a href="${toAbsoluteUrl(nl.url)}" style="color:#171717;text-decoration:underline;text-underline-offset:2px;text-decoration-color:#d4d4d4;font-weight:600;font-size:14px">${escapeHtml(nl.name)} &rarr;</a><span style="color:#a3a3a3;font-size:13px"> ${escapeHtml(nl.description)}</span></li>`
  ).join("");

  const otherContentHtml = OTHER_CONTENT_I_LIKE.map((item) =>
    `<li style="padding:6px 0"><a href="${toAbsoluteUrl(item.url)}" style="color:#171717;text-decoration:underline;text-underline-offset:2px;text-decoration-color:#d4d4d4;font-weight:600;font-size:14px">${escapeHtml(item.name)} &rarr;</a><span style="color:#a3a3a3;font-size:13px"> ${escapeHtml(item.description)}</span></li>`
  ).join("");

  const categoriesHtml = FEATURED_CATEGORIES.map((cat) =>
    `<a href="${baseUrl}/news" style="display:inline-block;background:#f5f5f5;color:#525252;font-size:13px;font-weight:600;padding:5px 12px;border-radius:999px;text-decoration:none;margin:3px 4px 3px 0">${escapeHtml(cat.label)}</a>`
  ).join("");

  return `
      <div style="margin:32px 0 0;padding:24px;background:#fafafa;border-radius:12px">
        <h2 style="font-size:18px;font-weight:800;margin:0 0 16px;color:#171717">Want to read more?</h2>
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.05em">Recommended newsletters &amp; links</p>
        <ul style="list-style:none;padding:0;margin:0 0 20px">${newslettersHtml}</ul>
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.05em">Other content I like</p>
        <ul style="list-style:none;padding:0;margin:0 0 20px">${otherContentHtml}</ul>
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.05em">Browse by topic</p>
        <div>${categoriesHtml}</div>
      </div>`;
}

function renderDigestHtml(digest: CampaignDigest, links: { unsubscribe: string; preferences: string }) {
  const itemsHtml = renderDigestItemsHtml(digest);
  const totals = digest.totalViews !== undefined
    ? `<div style="display:inline-block;background:#f5f5f5;border-radius:8px;padding:8px 16px;margin-bottom:8px;font-size:14px;color:#525252"><strong style="color:#171717">${digest.totalViews.toLocaleString()}</strong> total views${digest.deltaViews !== undefined ? ` <span style="color:${digest.deltaViews >= 0 ? "#16a34a" : "#dc2626"}">${digest.deltaViews >= 0 ? "+" : ""}${digest.deltaViews.toLocaleString()}</span>` : ""}</div>`
    : "";

  const body = digest.groups && digest.groups.length > 0
    ? itemsHtml
    : `<ul style="list-style:none;padding:0;margin:0">${itemsHtml}</ul>`;

  return `
    <div style="max-width:560px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#171717;line-height:1.6">
      <div style="padding:32px 0 20px">
        <div style="width:64px;height:64px;border-radius:50%;overflow:hidden">
          <img src="${NEWSLETTER_AVATAR_URL}" alt="dcbuilder.eth" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:cover" />
        </div>
      </div>
      <h1 style="font-size:24px;font-weight:800;margin:0 0 6px;color:#171717">${escapeHtml(digest.heading)}</h1>
      <p style="margin:0 0 20px;color:#737373;font-size:15px">${escapeHtml(digest.summary)}</p>
      ${totals}
      ${body}
      ${renderWantMoreHtml()}
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0 16px" />
      <p style="margin:0;font-size:12px;color:#a3a3a3">
        <a href="${links.preferences}" style="color:#a3a3a3;text-decoration:underline">Manage preferences</a> · <a href="${links.unsubscribe}" style="color:#a3a3a3;text-decoration:underline">Unsubscribe</a>
      </p>
    </div>
  `;
}

function renderWantMoreText() {
  const newslettersText = getRecommendedLinks({ includeNewsletterExtras: true }).map((nl) =>
    `- ${nl.name} — ${nl.description} (${toAbsoluteUrl(nl.url)})`
  ).join("\n");
  const otherText = OTHER_CONTENT_I_LIKE.map((item) =>
    `- ${item.name} — ${item.description} (${toAbsoluteUrl(item.url)})`
  ).join("\n");
  const categoriesText = FEATURED_CATEGORIES.map((cat) => cat.label).join(" · ");
  return `\n\nWant to read more?\n\nRecommended newsletters & links:\n${newslettersText}\n\nOther content I like:\n${otherText}\n\nBrowse by topic: ${categoriesText}\n${getBaseUrl()}/news`;
}

function renderDigestText(digest: CampaignDigest, links: { unsubscribe: string; preferences: string }) {
  const totals = digest.totalViews !== undefined
    ? `Total views: ${digest.totalViews}${digest.deltaViews !== undefined ? ` (${digest.deltaViews >= 0 ? "+" : ""}${digest.deltaViews} vs previous period)` : ""}\n`
    : "";

  return `${digest.heading}\n${digest.summary}\n${totals}${renderDigestItemsText(digest)}${renderWantMoreText()}\n\nManage preferences: ${links.preferences}\nUnsubscribe: ${links.unsubscribe}`;
}

function renderDigestItemsMarkdown(digest: CampaignDigest) {
  return digest.items.length > 0
    ? digest.items.map((item) => {
      const metric = item.currentViews !== undefined
        ? `${item.currentViews} views${item.delta !== undefined ? ` (${item.delta >= 0 ? "+" : ""}${item.delta})` : ""}`
        : "";
      const pieces = [
        `**${item.title}**`,
        item.subtitle || "",
        metric,
        item.url ? `[open](${item.url})` : "",
      ].filter(Boolean);
      return `- ${pieces.join(" · ")}`;
    }).join("\n")
    : "- No items available for this period.";
}

function renderRecentNewsMarkdown(recentNews: Awaited<ReturnType<typeof getRecentNewsSnapshot>>) {
  return recentNews.length > 0
    ? recentNews.map((item) => `- [${item.title}](${item.url}) · ${item.source} · ${item.date}`).join("\n")
    : "- No recent news available.";
}

function renderWantMoreMarkdown() {
  const baseUrl = getBaseUrl();
  const newslettersMd = getRecommendedLinks({ includeNewsletterExtras: true }).map((nl) =>
    `- **[${nl.name}](${toAbsoluteUrl(nl.url)})** — ${nl.description}`
  ).join("\n");
  const otherMd = OTHER_CONTENT_I_LIKE.map((item) =>
    `- **[${item.name}](${toAbsoluteUrl(item.url)})** — ${item.description}`
  ).join("\n");
  const categoriesMd = FEATURED_CATEGORIES.map((cat) =>
    `\`${cat.label}\``
  ).join(" · ");
  return `\n---\n\n### Want to read more?\n\n**Recommended newsletters & links**\n\n${newslettersMd}\n\n**Other content I like**\n\n${otherMd}\n\n**Browse by topic:** ${categoriesMd}\n\n[View all news →](${baseUrl}/news)`;
}

function renderDigestMarkdown(
  digest: CampaignDigest,
  links: { unsubscribe: string; preferences: string },
) {
  const totals = digest.totalViews !== undefined
    ? `\nTotal views: ${digest.totalViews}${digest.deltaViews !== undefined ? ` (${digest.deltaViews >= 0 ? "+" : ""}${digest.deltaViews} vs previous period)` : ""}\n`
    : "\n";

  return `## ${digest.heading}

${digest.summary}
${totals}
${renderDigestItemsMarkdown(digest)}
${renderWantMoreMarkdown()}

[Manage preferences](${links.preferences}) | [Unsubscribe](${links.unsubscribe})`;
}

function interpolateTemplate(template: string, values: Record<string, string>) {
  return template.replace(/{{\s*([a-z0-9_]+)\s*}}/gi, (_, key: string) => values[key] ?? "");
}

function stripMarkdownBold(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^\*\*(.+)\*\*$/);
  return match ? match[1] : trimmed;
}

function parseMarkdownLink(value: string): { label: string; url: string } | null {
  const match = value.trim().match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
  if (!match) return null;
  return { label: match[1], url: match[2] };
}

function isLikelyMetricPiece(value: string): boolean {
  return /(?:views?|opens?|clicks?|subscribers?|applications?|applies?)(?:\s|$)/i.test(value.trim());
}

function renderDigestMarkdownListItem(itemContent: string): string {
  const parts = itemContent.includes(" · ")
    ? itemContent.split(" · ").map((part) => part.trim()).filter(Boolean)
    : itemContent.split(" | ").map((part) => part.trim()).filter(Boolean);

  const linkPart = parts.at(-1);
  const openLink = linkPart ? parseMarkdownLink(linkPart) : null;
  const itemUrl = openLink?.label.toLowerCase() === "open" ? openLink.url : undefined;
  const contentParts = itemUrl ? parts.slice(0, -1) : [...parts];
  const rawTitle = contentParts.shift() || "Untitled";
  const titleLink = parseMarkdownLink(stripMarkdownBold(rawTitle));
  const title = titleLink?.label || stripMarkdownBold(rawTitle);
  const url = titleLink?.url || itemUrl;

  let metric = "";
  const subtitleParts: string[] = [];

  for (const part of contentParts) {
    if (!metric && isLikelyMetricPiece(part)) {
      metric = part;
      continue;
    }
    subtitleParts.push(part);
  }

  const titleHtml = url
    ? `<a href="${url}" style="color:#171717;text-decoration:underline;text-underline-offset:2px;text-decoration-color:#d4d4d4;font-weight:600;font-size:15px">${escapeHtml(title)}</a>`
    : `<strong style="font-size:15px">${escapeHtml(title)}</strong>`;
  const subtitle = subtitleParts.join(" · ");
  const subtitleHtml = subtitle
    ? `<div style="color:#525252;font-size:14px;margin-top:2px">${renderInlineMarkdown(subtitle)}</div>`
    : "";
  const metricHtml = metric
    ? `<div style="color:#a3a3a3;font-size:12px;margin-top:2px">${escapeHtml(metric)}</div>`
    : "";

  return `<li style="padding:10px 0;border-bottom:1px solid #f5f5f5">${titleHtml}${subtitleHtml}${metricHtml}</li>`;
}

function renderWantMoreMarkdownListItem(itemContent: string): string {
  const emphasizedLinkMatch = itemContent.match(/^\*\*\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)\*\*\s+[—-]\s+(.+)$/);
  if (emphasizedLinkMatch) {
    const [, label, url, description] = emphasizedLinkMatch;
    return `<li style="padding:6px 0"><a href="${url}" style="color:#171717;text-decoration:underline;text-underline-offset:2px;text-decoration-color:#d4d4d4;font-weight:600;font-size:14px">${escapeHtml(label)} &rarr;</a><span style="color:#a3a3a3;font-size:13px"> ${renderInlineMarkdown(description)}</span></li>`;
  }

  return `<li style="padding:6px 0;font-size:14px;line-height:1.7;color:#525252;">${renderInlineMarkdown(itemContent)}</li>`;
}

function renderNewsletterFooterHtml(value: string): string {
  return `<p style="margin:0;font-size:12px;color:#a3a3a3">${renderInlineMarkdown(value.replace(/\s+\|\s+/g, " · "))}</p>`;
}

function renderInlineMarkdown(value: string): string {
  let html = escapeHtml(value);

  html = html.replace(/`([^`]+)`/g, `<code style="font-family:${MONO_FONT_STACK};font-size:0.95em;border:1px solid #e5e5e5;background:#fafafa;padding:1px 4px;border-radius:4px;">$1</code>`);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "<a href=\"$2\" style=\"color:#111111;text-decoration:underline;text-underline-offset:2px;text-decoration-thickness:1px;\">$1</a>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return html;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const output: string[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];
  let listMode: "plain" | "digest" | "wantMore" = "plain";
  let quoteLines: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let sawPrimaryHeading = false;
  let expectingSummary = false;
  let inWantMoreCard = false;
  let footerHtml = "";
  let pendingDivider = false;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const html = paragraphLines.join("<br />");

    if (expectingSummary) {
      output.push(`<p style="margin:0 0 20px;color:#737373;font-size:15px">${html}</p>`);
      paragraphLines = [];
      expectingSummary = false;
      return;
    }

    const sectionLabel = !html.includes("href=") ? html.match(/^<strong>(.+)<\/strong>$/) : null;
    if (inWantMoreCard && sectionLabel) {
      output.push(`<p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.05em">${sectionLabel[1]}</p>`);
      paragraphLines = [];
      return;
    }

    output.push(
      inWantMoreCard
        ? `<p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#525252;">${html}</p>`
        : `<p style="margin:0 0 14px;font-size:16px;line-height:1.75;color:#1f1f1f;">${html}</p>`
    );
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    output.push(
      listMode === "digest"
        ? `<ul style="list-style:none;padding:0;margin:0">${listItems.join("")}</ul>`
        : listMode === "wantMore"
          ? `<ul style="list-style:none;padding:0;margin:0 0 20px">${listItems.join("")}</ul>`
          : `<ul style="margin:0 0 18px;padding:0 0 0 20px;">${listItems.join("")}</ul>`
    );
    listItems = [];
    listMode = "plain";
  };

  const flushQuote = () => {
    if (quoteLines.length === 0) return;
    output.push(`<blockquote style="margin:0 0 18px;padding:0 0 0 14px;border-left:2px solid #d4d4d4;"><p style="margin:0;font-size:16px;line-height:1.75;color:#404040;">${quoteLines.join("<br />")}</p></blockquote>`);
    quoteLines = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  const closeWantMoreCard = () => {
    if (!inWantMoreCard) return;
    flushAll();
    output.push("</div>");
    inWantMoreCard = false;
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (inCodeBlock) {
      if (trimmed.startsWith("```")) {
        output.push(`<pre style="margin:0 0 18px;padding:12px 14px;border:1px solid #e5e5e5;background:#fafafa;overflow:auto;"><code style="font-family:${MONO_FONT_STACK};font-size:13px;line-height:1.6;color:#171717;">${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCodeBlock = false;
      } else {
        codeLines.push(rawLine);
      }
      continue;
    }

    if (trimmed && pendingDivider) {
      const nextIsWantMore = /^#{1,6}\s+want to read more\??$/i.test(trimmed);
      if (!nextIsWantMore) {
        output.push("<hr style=\"border:0;border-top:1px solid #e5e5e5;margin:20px 0;\" />");
      }
      pendingDivider = false;
    }

    if (trimmed.startsWith("```")) {
      flushAll();
      inCodeBlock = true;
      continue;
    }

    if (!trimmed) {
      flushAll();
      continue;
    }

    if (/^(---|\*\*\*)$/.test(trimmed)) {
      flushAll();
      pendingDivider = true;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushAll();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      if (!sawPrimaryHeading && level <= 2) {
        output.push(`<h1 style="font-size:24px;font-weight:800;margin:0 0 6px;color:#171717">${renderInlineMarkdown(headingText)}</h1>`);
        sawPrimaryHeading = true;
        expectingSummary = true;
        continue;
      }

      if (/^want to read more\??$/i.test(headingText)) {
        closeWantMoreCard();
        output.push('<div style="margin:32px 0 0;padding:24px;background:#fafafa;border-radius:12px">');
        output.push(`<h2 style="font-size:18px;font-weight:800;margin:0 0 16px;color:#171717">${renderInlineMarkdown(headingText)}</h2>`);
        inWantMoreCard = true;
        continue;
      }

      const fontSizeByLevel = [0, 34, 24, 18, 16, 15, 14];
      const headingSize = fontSizeByLevel[level] ?? 16;
      output.push(`<h${level} style="margin:20px 0 10px;font-family:${SUBSTACK_SANS_FONT_STACK};font-size:${headingSize}px;line-height:1.22;font-weight:700;color:#111111;">${renderInlineMarkdown(headingText)}</h${level}>`);
      continue;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      flushParagraph();
      flushQuote();
      const itemContent = listMatch[1];
      const isDigestItem = !inWantMoreCard && (itemContent.includes(" · ") || itemContent.includes("|"));
      if (isDigestItem) {
        listMode = "digest";
        listItems.push(renderDigestMarkdownListItem(itemContent));
      } else if (inWantMoreCard) {
        listMode = "wantMore";
        listItems.push(renderWantMoreMarkdownListItem(itemContent));
      } else {
        listItems.push(`<li style="margin:0 0 10px;font-size:16px;line-height:1.75;color:#1f1f1f;">${renderInlineMarkdown(itemContent)}</li>`);
      }
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quoteLines.push(renderInlineMarkdown(quoteMatch[1]));
      continue;
    }

    if (trimmed.includes("[Manage preferences](") && trimmed.includes("[Unsubscribe](")) {
      flushList();
      flushQuote();
      flushParagraph();
      closeWantMoreCard();
      footerHtml = renderNewsletterFooterHtml(trimmed);
      continue;
    }

    flushList();
    flushQuote();
    paragraphLines.push(renderInlineMarkdown(trimmed));
  }

  if (inCodeBlock) {
    output.push(`<pre style="margin:0 0 18px;padding:12px 14px;border:1px solid #e5e5e5;background:#fafafa;overflow:auto;"><code style="font-family:${MONO_FONT_STACK};font-size:13px;line-height:1.6;color:#171717;">${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }

  if (pendingDivider) {
    output.push("<hr style=\"border:0;border-top:1px solid #e5e5e5;margin:20px 0;\" />");
  }

  flushAll();
  closeWantMoreCard();
  const html = output.join("\n").trim();
  if (!html) return "";
  return `
    <div style="max-width:560px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#171717;line-height:1.6">
      <div style="padding:32px 0 20px">
        <div style="width:64px;height:64px;border-radius:50%;overflow:hidden">
          <img src="${NEWSLETTER_AVATAR_URL}" alt="dcbuilder.eth" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:cover" />
        </div>
      </div>
      ${html}
      ${footerHtml ? `<hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0 16px" />${footerHtml}` : ""}
    </div>
  `.trim();
}

function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function markdownToText(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1 ($2)")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function getRecentNewsSnapshot(limit: number = 8) {
  const allNews = await getAllNews();
  return allNews.slice(0, limit).map((item) => ({
    title: item.title,
    url: toAbsoluteUrl(item.url),
    date: item.date,
    type: item.type,
    source: item.source || item.company || item.type,
    category: item.category || "general",
  }));
}

function renderRecentNewsHtml(recentNews: Awaited<ReturnType<typeof getRecentNewsSnapshot>>) {
  if (recentNews.length === 0) return `<p style="color:#a3a3a3">No recent news available.</p>`;

  const groupMap = new Map<string, typeof recentNews>();
  for (const item of recentNews) {
    const cat = item.category || "general";
    if (!groupMap.has(cat)) groupMap.set(cat, []);
    groupMap.get(cat)!.push(item);
  }

  const sortedEntries = sortGroupsByCategory(
    Array.from(groupMap.entries()).map(([cat, items]) => ({ category: cat, items }))
  );

  return sortedEntries.map(({ category: cat, items }) => {
    const label = newsletterLabel(cat);
    const itemsHtml = items.map((item) =>
      `<li style="padding:8px 0;border-bottom:1px solid #f5f5f5"><a href="${item.url}" style="color:#171717;text-decoration:underline;text-underline-offset:2px;text-decoration-color:#d4d4d4;font-weight:600">${escapeHtml(item.title)}</a><br/><span style="color:#a3a3a3;font-size:13px">${escapeHtml(item.source)} · ${escapeHtml(item.date)}</span></li>`
    ).join("");
    return `<h3 style="font-size:15px;font-weight:700;color:#171717;margin:24px 0 8px;padding-bottom:8px;border-bottom:2px solid #171717">${escapeHtml(label)}</h3><ul style="list-style:none;padding:0;margin:0">${itemsHtml}</ul>`;
  }).join("");
}

function renderRecentNewsText(recentNews: Awaited<ReturnType<typeof getRecentNewsSnapshot>>) {
  if (recentNews.length === 0) return "- No recent news available.";

  const groupMap = new Map<string, typeof recentNews>();
  for (const item of recentNews) {
    const cat = item.category || "general";
    if (!groupMap.has(cat)) groupMap.set(cat, []);
    groupMap.get(cat)!.push(item);
  }

  const sortedEntries = sortGroupsByCategory(
    Array.from(groupMap.entries()).map(([cat, items]) => ({ category: cat, items }))
  );

  return sortedEntries.map(({ category: cat, items }) => {
    const label = newsletterLabel(cat);
    const header = `\n## ${label}`;
    const lines = items.map((item) => `- ${item.title} | ${item.source} | ${item.date} | ${item.url}`).join("\n");
    return `${header}\n${lines}`;
  }).join("\n");
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

  return normalizeLegacyTemplatePayload({
    newsletterType,
    subjectTemplate: stored.subjectTemplate,
    htmlTemplate: stored.htmlTemplate,
    textTemplate: stored.textTemplate,
    markdownTemplate: stored.markdownTemplate,
  });
}

function buildTemplateValues(params: {
  campaignSubject: string;
  campaignType: NewsletterType;
  periodDays: number;
  digest: CampaignDigest;
  links: { unsubscribe: string; preferences: string };
  recentNews: Awaited<ReturnType<typeof getRecentNewsSnapshot>>;
  now?: Date;
}) {
  const now = params.now || new Date();
  const recentHtml = renderRecentNewsHtml(params.recentNews);
  const recentText = renderRecentNewsText(params.recentNews);
  const recentMarkdown = renderRecentNewsMarkdown(params.recentNews);

  const defaultHtmlBody = renderDigestHtml(params.digest, params.links);
  const defaultTextBody = renderDigestText(params.digest, params.links);
  const defaultMarkdownBody = renderDigestMarkdown(params.digest, params.links);

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
    digest_items_markdown: renderDigestItemsMarkdown(params.digest),
    recent_news_html: recentHtml,
    recent_news_text: recentText,
    recent_news_markdown: recentMarkdown,
    unsubscribe_url: params.links.unsubscribe,
    preferences_url: params.links.preferences,
    default_html_body: defaultHtmlBody,
    default_text_body: defaultTextBody,
    default_markdown_body: defaultMarkdownBody,
    generated_at_iso: now.toISOString(),
  };

  return {
    values,
    defaultHtmlBody,
    defaultTextBody,
    defaultMarkdownBody,
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
  const { values, defaultHtmlBody, defaultTextBody } = buildTemplateValues(params);
  const resolvedCampaignSubject = interpolateTemplate(
    params.campaignSubject,
    { ...values, campaign_subject: params.campaignSubject }
  ).trim() || params.campaignSubject;
  const nextValues: Record<string, string> = {
    ...values,
    campaign_subject: resolvedCampaignSubject,
  };

  const renderedSubject = interpolateTemplate(params.template.subjectTemplate, nextValues).trim();
  const renderedHtml = interpolateTemplate(params.template.htmlTemplate, nextValues).trim();
  const renderedText = interpolateTemplate(params.template.textTemplate, nextValues).trim();

  return {
    subject: renderedSubject || resolvedCampaignSubject,
    html: renderedHtml || defaultHtmlBody,
    text: renderedText || defaultTextBody,
    values: nextValues,
  };
}

function renderMarkdownStarter(params: {
  template: NewsletterTemplatePayload;
  campaignSubject: string;
  campaignType: NewsletterType;
  periodDays: number;
  digest: CampaignDigest;
  links: { unsubscribe: string; preferences: string };
  recentNews: Awaited<ReturnType<typeof getRecentNewsSnapshot>>;
  now?: Date;
}) {
  const templateRender = renderTemplateContent(params);
  const starter = interpolateTemplate(params.template.markdownTemplate, templateRender.values).trim();
  return {
    markdown: starter || templateRender.values.default_markdown_body,
    values: templateRender.values,
  };
}

type CampaignContentDraft = {
  campaignSubject: string;
  contentMode: NewsletterContentMode;
  markdownContent?: string | null;
  manualHtml?: string | null;
  manualText?: string | null;
};

function validateCampaignContentDraft(input: CampaignContentDraft) {
  if (!NEWSLETTER_CONTENT_MODES.includes(input.contentMode)) {
    return { ok: false as const, status: 400, error: "Invalid content mode" };
  }

  if (input.contentMode === "markdown" && !input.markdownContent?.trim()) {
    return { ok: false as const, status: 400, error: "Markdown content is required for markdown mode" };
  }

  if (input.contentMode === "manual") {
    if (!input.manualHtml?.trim() || !input.manualText?.trim()) {
      return { ok: false as const, status: 400, error: "manualHtml and manualText are required for manual mode" };
    }
  }

  return { ok: true as const };
}

function resolveCampaignRenderContent(params: {
  campaign: CampaignContentDraft;
  template: NewsletterTemplatePayload;
  campaignType: NewsletterType;
  periodDays: number;
  digest: CampaignDigest;
  links: { unsubscribe: string; preferences: string };
  recentNews: Awaited<ReturnType<typeof getRecentNewsSnapshot>>;
  now?: Date;
}) {
  const validation = validateCampaignContentDraft(params.campaign);
  if (!validation.ok) {
    return validation;
  }

  const templateRendered = renderTemplateContent({
    template: params.template,
    campaignSubject: params.campaign.campaignSubject,
    campaignType: params.campaignType,
    periodDays: params.periodDays,
    digest: params.digest,
    links: params.links,
    recentNews: params.recentNews,
    now: params.now,
  });

  if (params.campaign.contentMode === "template") {
    return {
      ok: true as const,
      data: {
        subject: templateRendered.subject,
        html: templateRendered.html,
        text: templateRendered.text,
      },
    };
  }

  if (params.campaign.contentMode === "markdown") {
    const renderedMarkdown = interpolateTemplate(
      params.campaign.markdownContent || "",
      templateRendered.values
    ).trim();
    if (!renderedMarkdown) {
      return { ok: false as const, status: 400, error: "Markdown content resolved to empty output" };
    }

    const html = markdownToHtml(renderedMarkdown);
    const text = markdownToText(renderedMarkdown);
    return {
      ok: true as const,
      data: {
        subject: templateRendered.values.campaign_subject,
        html,
        text,
      },
    };
  }

  const html = interpolateTemplate(params.campaign.manualHtml || "", templateRendered.values).trim();
  const text = interpolateTemplate(params.campaign.manualText || "", templateRendered.values).trim();
  if (!html || !text) {
    return { ok: false as const, status: 400, error: "manualHtml and manualText resolved to empty output" };
  }

  return {
    ok: true as const,
    data: {
      subject: templateRendered.values.campaign_subject,
      html,
      text,
    },
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
    return normalizeLegacyTemplatePayload({
      newsletterType: type,
      subjectTemplate: stored.subjectTemplate,
      htmlTemplate: stored.htmlTemplate,
      textTemplate: stored.textTemplate,
      markdownTemplate: stored.markdownTemplate,
    });
  });
}

export async function upsertNewsletterTemplate(input: {
  newsletterType: string;
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string;
  markdownTemplate: string;
}) {
  if (!NEWSLETTER_TYPES.includes(input.newsletterType as NewsletterType)) {
    return { ok: false as const, status: 400, error: "Invalid newsletter type" };
  }
  if (
    !input.subjectTemplate.trim() ||
    !input.htmlTemplate.trim() ||
    !input.textTemplate.trim() ||
    !input.markdownTemplate.trim()
  ) {
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
        markdownTemplate: input.markdownTemplate,
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
      markdownTemplate: input.markdownTemplate,
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
  markdownTemplate?: string;
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
    markdownTemplate: input.markdownTemplate ?? storedTemplate.markdownTemplate,
  };

  const campaignSubject = typeof input.campaignSubject === "string" && input.campaignSubject.trim()
    ? input.campaignSubject.trim()
    : `Preview: ${digest.heading}`;

  const renderInput = {
    template,
    campaignSubject,
    campaignType: newsletterType,
    periodDays,
    digest,
    links: {
      unsubscribe: "https://dcbuilder.dev/api/v1/newsletter/unsubscribe?token=preview-token",
      preferences: "https://dcbuilder.dev/api/v1/newsletter/preferences?token=preview-token",
    },
    recentNews,
    now: new Date(),
  };
  const rendered = renderTemplateContent(renderInput);
  const starter = renderMarkdownStarter(renderInput);

  return {
    ok: true as const,
    data: {
      placeholders: [...NEWSLETTER_TEMPLATE_PLACEHOLDERS],
      template,
      rendered,
      starter,
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

export async function getNewsletterCampaignById(campaignId: string) {
  const [campaign] = await db
    .select()
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    return { ok: false as const, status: 404, error: "Campaign not found" };
  }

  return { ok: true as const, data: campaign };
}

function validatePeriodDays(periodDays?: number) {
  if (periodDays === undefined) {
    return { ok: true as const, data: DEFAULT_CAMPAIGN_PERIOD_DAYS };
  }
  if (!Number.isInteger(periodDays) || periodDays < 1 || periodDays > 30) {
    return { ok: false as const, status: 400, error: "periodDays must be an integer between 1 and 30" };
  }
  return { ok: true as const, data: periodDays };
}

function parseScheduledAt(scheduledAtIso?: string): Date | null | "invalid" {
  if (!scheduledAtIso) return null;
  const scheduledAt = new Date(scheduledAtIso);
  if (Number.isNaN(scheduledAt.getTime())) return "invalid";
  return scheduledAt;
}

function isCampaignMutable(status: string): boolean {
  return MUTABLE_CAMPAIGN_STATUSES.has(status as "draft" | "scheduled");
}

function normalizeCampaignContentByMode(input: {
  contentMode: NewsletterContentMode;
  markdownContent?: string | null;
  manualHtml?: string | null;
  manualText?: string | null;
}) {
  if (input.contentMode === "template") {
    return {
      markdownContent: null,
      manualHtml: null,
      manualText: null,
    };
  }

  if (input.contentMode === "markdown") {
    return {
      markdownContent: input.markdownContent?.trim() || null,
      manualHtml: null,
      manualText: null,
    };
  }

  return {
    markdownContent: null,
    manualHtml: input.manualHtml?.trim() || null,
    manualText: input.manualText?.trim() || null,
  };
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
  contentMode?: string;
  markdownContent?: string | null;
  manualHtml?: string | null;
  manualText?: string | null;
}) {
  if (!NEWSLETTER_TYPES.includes(input.newsletterType as NewsletterType)) {
    return { ok: false as const, status: 400, error: "Invalid newsletter type" };
  }
  if (!input.subject?.trim()) {
    return { ok: false as const, status: 400, error: "Subject is required" };
  }

  if (input.contentMode && !NEWSLETTER_CONTENT_MODES.includes(input.contentMode as NewsletterContentMode)) {
    return { ok: false as const, status: 400, error: "Invalid content mode" };
  }
  const contentMode = normalizeNewsletterContentMode(input.contentMode);
  const contentValidation = validateCampaignContentDraft({
    campaignSubject: input.subject,
    contentMode,
    markdownContent: input.markdownContent,
    manualHtml: input.manualHtml,
    manualText: input.manualText,
  });
  if (!contentValidation.ok) {
    return contentValidation;
  }

  const periodValidation = validatePeriodDays(input.periodDays);
  if (!periodValidation.ok) {
    return periodValidation;
  }
  const periodDays = periodValidation.data;
  const scheduledAt = parseScheduledAt(input.scheduledAt);
  if (scheduledAt === "invalid") {
    return { ok: false as const, status: 400, error: "Invalid scheduledAt value" };
  }
  const content = normalizeCampaignContentByMode({
    contentMode,
    markdownContent: input.markdownContent,
    manualHtml: input.manualHtml,
    manualText: input.manualText,
  });

  const [campaign] = await db
    .insert(newsletterCampaigns)
    .values({
      newsletterType: input.newsletterType as NewsletterType,
      subject: input.subject.trim(),
      previewText: input.previewText || null,
      contentMode,
      markdownContent: content.markdownContent,
      manualHtml: content.manualHtml,
      manualText: content.manualText,
      periodDays,
      status: scheduledAt ? "scheduled" : "draft",
      scheduledAt,
      createdBy: input.createdBy || null,
    })
    .returning();

  return { ok: true as const, data: campaign };
}

export async function scheduleNewsletterCampaign(campaignId: string, scheduledAtIso: string) {
  const existing = await getNewsletterCampaignById(campaignId);
  if (!existing.ok) {
    return existing;
  }
  if (!isCampaignMutable(existing.data.status)) {
    return { ok: false as const, status: 409, error: "Only draft or scheduled campaigns can be modified" };
  }

  const scheduledAt = parseScheduledAt(scheduledAtIso);
  if (scheduledAt === "invalid") {
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

export async function updateNewsletterCampaign(campaignId: string, input: {
  newsletterType?: string;
  subject?: string;
  previewText?: string | null;
  periodDays?: number;
  scheduledAt?: string | null;
  contentMode?: string;
  markdownContent?: string | null;
  manualHtml?: string | null;
  manualText?: string | null;
}) {
  const current = await getNewsletterCampaignById(campaignId);
  if (!current.ok) {
    return current;
  }
  if (!isCampaignMutable(current.data.status)) {
    return { ok: false as const, status: 409, error: "Only draft or scheduled campaigns can be modified" };
  }

  const newsletterType = input.newsletterType
    ? (NEWSLETTER_TYPES.includes(input.newsletterType as NewsletterType) ? input.newsletterType as NewsletterType : null)
    : current.data.newsletterType as NewsletterType;
  if (!newsletterType) {
    return { ok: false as const, status: 400, error: "Invalid newsletter type" };
  }

  const subject = (input.subject ?? current.data.subject)?.trim();
  if (!subject) {
    return { ok: false as const, status: 400, error: "Subject is required" };
  }

  if (input.contentMode && !NEWSLETTER_CONTENT_MODES.includes(input.contentMode as NewsletterContentMode)) {
    return { ok: false as const, status: 400, error: "Invalid content mode" };
  }
  const contentMode = normalizeNewsletterContentMode(input.contentMode ?? current.data.contentMode);
  const draftValidation = validateCampaignContentDraft({
    campaignSubject: subject,
    contentMode,
    markdownContent: input.markdownContent ?? current.data.markdownContent,
    manualHtml: input.manualHtml ?? current.data.manualHtml,
    manualText: input.manualText ?? current.data.manualText,
  });
  if (!draftValidation.ok) {
    return draftValidation;
  }

  const periodValidation = validatePeriodDays(input.periodDays);
  if (!periodValidation.ok) {
    return periodValidation;
  }
  const periodDays = input.periodDays === undefined ? current.data.periodDays : periodValidation.data;
  const scheduledAt = input.scheduledAt === null
    ? null
    : parseScheduledAt(input.scheduledAt ?? (current.data.scheduledAt ? current.data.scheduledAt.toISOString() : undefined));
  if (scheduledAt === "invalid") {
    return { ok: false as const, status: 400, error: "Invalid scheduledAt value" };
  }

  const normalizedContent = normalizeCampaignContentByMode({
    contentMode,
    markdownContent: input.markdownContent ?? current.data.markdownContent,
    manualHtml: input.manualHtml ?? current.data.manualHtml,
    manualText: input.manualText ?? current.data.manualText,
  });

  const [updated] = await db
    .update(newsletterCampaigns)
    .set({
      newsletterType,
      subject,
      previewText: input.previewText === undefined ? current.data.previewText : (input.previewText || null),
      periodDays,
      scheduledAt,
      status: scheduledAt ? "scheduled" : "draft",
      contentMode,
      markdownContent: normalizedContent.markdownContent,
      manualHtml: normalizedContent.manualHtml,
      manualText: normalizedContent.manualText,
      updatedAt: new Date(),
    })
    .where(eq(newsletterCampaigns.id, campaignId))
    .returning();

  return { ok: true as const, data: updated };
}

export async function deleteNewsletterCampaign(campaignId: string) {
  const current = await getNewsletterCampaignById(campaignId);
  if (!current.ok) {
    return current;
  }
  if (!isCampaignMutable(current.data.status)) {
    return { ok: false as const, status: 409, error: "Only draft or scheduled campaigns can be deleted" };
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(newsletterSendEvents)
      .where(eq(newsletterSendEvents.campaignId, campaignId));
    await tx
      .delete(newsletterCampaignRecipients)
      .where(eq(newsletterCampaignRecipients.campaignId, campaignId));
    await tx
      .delete(newsletterCampaigns)
      .where(eq(newsletterCampaigns.id, campaignId));
  });

  return { ok: true as const, data: { id: campaignId } };
}

export async function previewNewsletterCampaignDraft(input: {
  newsletterType: string;
  subject: string;
  periodDays?: number;
  contentMode?: string;
  markdownContent?: string | null;
  manualHtml?: string | null;
  manualText?: string | null;
}) {
  if (!NEWSLETTER_TYPES.includes(input.newsletterType as NewsletterType)) {
    return { ok: false as const, status: 400, error: "Invalid newsletter type" };
  }
  if (!input.subject?.trim()) {
    return { ok: false as const, status: 400, error: "Subject is required" };
  }

  if (input.contentMode && !NEWSLETTER_CONTENT_MODES.includes(input.contentMode as NewsletterContentMode)) {
    return { ok: false as const, status: 400, error: "Invalid content mode" };
  }
  const newsletterType = input.newsletterType as NewsletterType;
  const periodValidation = validatePeriodDays(input.periodDays);
  if (!periodValidation.ok) {
    return periodValidation;
  }
  const periodDays = periodValidation.data;
  const contentMode = normalizeNewsletterContentMode(input.contentMode);

  const validation = validateCampaignContentDraft({
    campaignSubject: input.subject.trim(),
    contentMode,
    markdownContent: input.markdownContent,
    manualHtml: input.manualHtml,
    manualText: input.manualText,
  });
  if (!validation.ok) {
    return validation;
  }

  const [digest, recentNews, template] = await Promise.all([
    buildDigest(newsletterType, periodDays),
    getRecentNewsSnapshot(8),
    getNewsletterTemplatePayload(newsletterType),
  ]);
  const links = {
    unsubscribe: "https://dcbuilder.dev/api/v1/newsletter/unsubscribe?token=preview-token",
    preferences: "https://dcbuilder.dev/api/v1/newsletter/preferences?token=preview-token",
  };

  const renderResult = resolveCampaignRenderContent({
    campaign: {
      campaignSubject: input.subject.trim(),
      contentMode,
      markdownContent: input.markdownContent,
      manualHtml: input.manualHtml,
      manualText: input.manualText,
    },
    template,
    campaignType: newsletterType,
    periodDays,
    digest,
    links,
    recentNews,
    now: new Date(),
  });
  if (!renderResult.ok) {
    return renderResult;
  }

  const starter = renderMarkdownStarter({
    template,
    campaignSubject: input.subject.trim(),
    campaignType: newsletterType,
    periodDays,
    digest,
    links,
    recentNews,
    now: new Date(),
  });

  return {
    ok: true as const,
    data: {
      rendered: renderResult.data,
      starter: { markdown: starter.markdown },
      placeholders: [...NEWSLETTER_TEMPLATE_PLACEHOLDERS],
      context: { digest, recentNews },
    },
  };
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
  if (campaign.status === "sending" && !force) {
    return { ok: false as const, status: 409, error: "Campaign is already being sent" };
  }
  if (!force && campaign.status === "scheduled" && campaign.scheduledAt && campaign.scheduledAt > new Date()) {
    return { ok: false as const, status: 409, error: "Campaign schedule is in the future" };
  }

  const contentMode = normalizeNewsletterContentMode(campaign.contentMode);
  const contentValidation = validateCampaignContentDraft({
    campaignSubject: campaign.subject,
    contentMode,
    markdownContent: campaign.markdownContent,
    manualHtml: campaign.manualHtml,
    manualText: campaign.manualText,
  });
  if (!contentValidation.ok) {
    await db
      .update(newsletterCampaigns)
      .set({
        status: "failed",
        failureReason: contentValidation.error,
        updatedAt: new Date(),
      })
      .where(eq(newsletterCampaigns.id, campaign.id));
    return contentValidation;
  }

  const now = new Date();
  const [lockedCampaign] = await db
    .update(newsletterCampaigns)
    .set({ status: "sending", failureReason: null, updatedAt: now })
    .where(
      and(
        eq(newsletterCampaigns.id, campaign.id),
        eq(newsletterCampaigns.status, campaign.status)
      )
    )
    .returning();
  if (!lockedCampaign) {
    const [latest] = await db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.id, campaign.id))
      .limit(1);

    if (!latest) {
      return { ok: false as const, status: 404, error: "Campaign not found" };
    }
    if (latest.status === "sent") {
      return {
        ok: true as const,
        data: { campaign: latest, sent: 0, failed: 0, skipped: 0, alreadySent: true },
      };
    }
    if (latest.status === "sending") {
      return { ok: false as const, status: 409, error: "Campaign is already being sent" };
    }

    return { ok: false as const, status: 409, error: "Campaign changed before send started" };
  }
  const sendingCampaign = lockedCampaign;
  const sendingContentMode = normalizeNewsletterContentMode(sendingCampaign.contentMode);

  const recipients = await resolveRecipients(sendingCampaign.newsletterType as NewsletterType);
  if (recipients.length === 0) {
    await db
      .update(newsletterCampaigns)
      .set({
        status: "failed",
        sentAt: null,
        failureReason: "No active recipients for this campaign type",
        updatedAt: new Date(),
      })
      .where(eq(newsletterCampaigns.id, sendingCampaign.id));
    return { ok: false as const, status: 409, error: "No active recipients for this campaign type" };
  }
  const activeRecipientIds = new Set(recipients.map((recipient) => recipient.id));

  const existingRecipients = await db
    .select()
    .from(newsletterCampaignRecipients)
    .where(eq(newsletterCampaignRecipients.campaignId, sendingCampaign.id));
  const existingBySubscriber = new Map(existingRecipients.map((row) => [row.subscriberId, row]));

  const pendingRecipientRows = recipients.filter((recipient) => !existingBySubscriber.has(recipient.id));
  if (pendingRecipientRows.length > 0) {
    await db.insert(newsletterCampaignRecipients).values(
      pendingRecipientRows.map((recipient) => ({
        campaignId: sendingCampaign.id,
        subscriberId: recipient.id,
        email: recipient.email,
        status: "pending",
      }))
    );
  }

  const campaignRecipients = await db
    .select()
    .from(newsletterCampaignRecipients)
    .where(eq(newsletterCampaignRecipients.campaignId, sendingCampaign.id));

  const campaignType = sendingCampaign.newsletterType as NewsletterType;
  const periodDays = sendingCampaign.periodDays || DEFAULT_CAMPAIGN_PERIOD_DAYS;
  const [digest, templatePayload, recentNews] = await Promise.all([
    buildDigest(campaignType, periodDays),
    getNewsletterTemplatePayload(campaignType),
    getRecentNewsSnapshot(8),
  ]);

  // Render a canonical archive version (generic links, no per-user tokens)
  const archiveLinks = {
    unsubscribe: `${getBaseUrl()}/newsletters`,
    preferences: `${getBaseUrl()}/newsletters`,
  };
  const archiveRendered = resolveCampaignRenderContent({
    campaign: {
      campaignSubject: sendingCampaign.subject,
      contentMode: sendingContentMode,
      markdownContent: sendingCampaign.markdownContent,
      manualHtml: sendingCampaign.manualHtml,
      manualText: sendingCampaign.manualText,
    },
    template: templatePayload,
    campaignType,
    periodDays,
    digest,
    links: archiveLinks,
    recentNews,
    now: new Date(),
  });
  if (archiveRendered.ok) {
    await db
      .update(newsletterCampaigns)
      .set({
        renderedHtml: archiveRendered.data.html,
        renderedText: archiveRendered.data.text,
        updatedAt: new Date(),
      })
      .where(eq(newsletterCampaigns.id, sendingCampaign.id));
  }

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
      newsletterType: sendingCampaign.newsletterType as NewsletterType,
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
    const renderedTemplate = resolveCampaignRenderContent({
      campaign: {
        campaignSubject: sendingCampaign.subject,
        contentMode: sendingContentMode,
        markdownContent: sendingCampaign.markdownContent,
        manualHtml: sendingCampaign.manualHtml,
        manualText: sendingCampaign.manualText,
      },
      template: templatePayload,
      campaignType,
      periodDays,
      digest,
      links,
      recentNews,
      now: new Date(),
    });
    if (!renderedTemplate.ok) {
      failedCount += 1;
      await db.transaction(async (tx) => {
        await tx
          .update(newsletterCampaignRecipients)
          .set({ status: "failed", errorMessage: renderedTemplate.error, updatedAt: new Date() })
          .where(eq(newsletterCampaignRecipients.id, recipient.id));

        await tx.insert(newsletterSendEvents).values({
          campaignId: sendingCampaign.id,
          recipientId: recipient.id,
          eventType: "failed",
          provider: "resend",
          payload: JSON.stringify({ email: recipient.email, error: renderedTemplate.error }),
        });
      });
      continue;
    }

    const emailResult = await sendEmail({
      to: recipient.email,
      subject: renderedTemplate.data.subject,
      html: renderedTemplate.data.html,
      text: renderedTemplate.data.text,
    });

    if (emailResult.success) {
      sentCount += 1;
      await db.transaction(async (tx) => {
        await tx
          .update(newsletterCampaignRecipients)
          .set({ status: "sent", sentAt: new Date(), errorMessage: null, updatedAt: new Date() })
          .where(eq(newsletterCampaignRecipients.id, recipient.id));

        await tx.insert(newsletterSendEvents).values({
          campaignId: sendingCampaign.id,
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
        campaignId: sendingCampaign.id,
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
    .where(eq(newsletterCampaigns.id, sendingCampaign.id));

  return {
    ok: true as const,
    data: {
      campaignId: sendingCampaign.id,
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

// ---------------------------------------------------------------------------
// Public archive queries
// ---------------------------------------------------------------------------

export async function listSentNewsletterCampaigns(limit: number = 50) {
  return db
    .select({
      id: newsletterCampaigns.id,
      subject: newsletterCampaigns.subject,
      previewText: newsletterCampaigns.previewText,
      newsletterType: newsletterCampaigns.newsletterType,
      sentAt: newsletterCampaigns.sentAt,
    })
    .from(newsletterCampaigns)
    .where(eq(newsletterCampaigns.status, "sent"))
    .orderBy(desc(newsletterCampaigns.sentAt))
    .limit(limit);
}

export async function getSentNewsletterCampaignForArchive(id: string) {
  const [campaign] = await db
    .select({
      id: newsletterCampaigns.id,
      subject: newsletterCampaigns.subject,
      previewText: newsletterCampaigns.previewText,
      newsletterType: newsletterCampaigns.newsletterType,
      sentAt: newsletterCampaigns.sentAt,
      renderedHtml: newsletterCampaigns.renderedHtml,
    })
    .from(newsletterCampaigns)
    .where(
      and(
        eq(newsletterCampaigns.id, id),
        eq(newsletterCampaigns.status, "sent")
      )
    )
    .limit(1);

  if (!campaign || !campaign.renderedHtml) {
    return null;
  }

  return campaign;
}
