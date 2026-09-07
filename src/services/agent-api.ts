import { createHash, randomBytes } from "node:crypto";
import { and, arrayOverlaps, desc, eq, gte, ilike, or, SQL } from "drizzle-orm";
import {
  agentAuditEvents,
  agentInboxComments,
  agentInboxSubmissions,
  agentInboxVersions,
  agentSubmitTokens,
  announcements,
  blogPosts,
  candidates,
  db,
  investments,
  jobs,
  curatedLinks,
  affiliations,
  type NewCandidate,
  type NewJob,
} from "@/db";
import type { AuthResult } from "@/services/auth";
import { extractRequestToken } from "@/services/auth";

type JsonObject = Record<string, unknown>;
type AgentKind = "job" | "candidate" | "message";
type AgentResource = "news" | "jobs" | "candidates" | "investments" | "blog" | "affiliations";
type AgentActor =
  | { type: "public"; priority: "low"; permissions: string[] }
  | { type: "api_key"; keyId: string; name: string; permissions: string[]; priority: "normal" }
  | {
      type: "submit_token";
      tokenId: string;
      submitterName: string | null;
      submitterEmail: string | null;
      allowedKinds: string[];
      permissions: string[];
      priority: "normal";
    };

const SENSITIVE_FIELDS: Record<string, string[]> = {
  candidates: ["email", "telegram", "calendly"],
  newsletter_subscribers: ["email"],
  newsletter_campaign_recipients: ["email"],
  newsletter_send_events: ["payload"],
  newsletter_unsub_tokens: ["token"],
  api_keys: ["key"],
};

const ALLOWED_QUERY_FIELDS: Record<AgentResource, string[]> = {
  jobs: ["id", "title", "company", "location", "remote", "type", "department", "tags", "category", "featured", "createdAt"],
  candidates: ["id", "name", "title", "location", "skills", "availability", "featured", "createdAt"],
  news: ["id", "title", "source", "company", "category", "date", "featured", "relevance"],
  investments: ["id", "title", "tier", "featured", "status", "categories", "createdAt"],
  blog: ["slug", "title", "date", "published", "relevance", "source"],
  affiliations: ["id", "title", "role", "dateBegin", "dateEnd", "xHandles"],
};

const ALLOWED_OPERATORS = new Set(["eq", "contains", "overlap", "gte", "lte", "ilike"]);
const AGENT_KINDS: AgentKind[] = ["job", "candidate", "message"];

export function buildAgentOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "dcbuilder.dev Agent API",
      version: "0.1.0",
    },
    paths: {
      "/api/agent/schema": { get: { summary: "Fetch this OpenAPI document" } },
      "/api/agent/news": { get: { summary: "List redacted news" } },
      "/api/agent/jobs": { get: { summary: "List redacted jobs" } },
      "/api/agent/candidates": { get: { summary: "List redacted candidates" } },
      "/api/agent/query": { post: { summary: "Run an allowlisted query DSL" } },
      "/api/agent/inbox": { get: { summary: "List approval inbox submissions" } },
      "/api/agent/inbox/{id}": { get: { summary: "Show one approval inbox submission" } },
      "/api/agent/inbox/{id}/comments": { post: { summary: "Comment on an inbox submission" } },
      "/api/agent/inbox/{id}/approve": { post: { summary: "Approve and publish a submission" } },
      "/api/agent/inbox/{id}/reject": { post: { summary: "Reject a submission" } },
      "/api/agent/submit/{kind}": { post: { summary: "Create a job, candidate, or message submission" } },
      "/api/agent/invites": { post: { summary: "Create a scoped submit-token invite" } },
      "/api/agent/search/refresh": { post: { summary: "Refresh semantic-search snapshots" } },
    },
    components: {
      securitySchemes: {
        bearerAgentToken: { type: "http", scheme: "bearer" },
        apiKeyHeader: { type: "apiKey", in: "header", name: "x-api-key" },
      },
    },
  };
}

export function parseAgentFilters(searchParams: URLSearchParams) {
  const filters: JsonObject = {};
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  filters.limit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 50;
  filters.offset = Number.isFinite(offset) && offset >= 0 ? offset : 0;

  for (const key of ["q", "query", "since", "company", "category", "location", "availability", "status", "featured", "remote"]) {
    const value = searchParams.get(key);
    if (value === null || value === "") continue;
    filters[key] = value === "true" ? true : value === "false" ? false : value;
  }

  const tags = [...searchParams.getAll("tag"), ...searchParams.getAll("tags")].filter(Boolean);
  if (tags.length > 0) filters.tags = tags;

  return filters;
}

export function validateAgentQuery(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Query body must be an object");
  const body = input as JsonObject;
  const table = normalizeResource(String(body.table ?? body.resource ?? ""));
  if (!table) throw new Error("Unsupported table/resource");

  const where = Array.isArray(body.where) ? body.where : [];
  for (const condition of where) {
    if (!condition || typeof condition !== "object") throw new Error("Invalid where condition");
    const { field, op } = condition as JsonObject;
    if (typeof field !== "string" || !ALLOWED_QUERY_FIELDS[table].includes(field)) {
      throw new Error(`Unsupported field for ${table}: ${String(field)}`);
    }
    if (typeof op !== "string" || !ALLOWED_OPERATORS.has(op)) {
      throw new Error(`Unsupported operator: ${String(op)}`);
    }
  }

  return { ...body, table, filters: (body.filters && typeof body.filters === "object" ? body.filters : {}) as JsonObject };
}

export function redactAgentRecord(resource: string, record: JsonObject, permissions: string[]) {
  if (canReadSensitive(permissions)) return record;
  const redacted = { ...record };
  for (const field of SENSITIVE_FIELDS[resource] ?? []) {
    if (field in redacted) redacted[field] = null;
  }
  return redacted;
}

export async function listAgentResource(resource: AgentResource, filters: JsonObject, permissions: string[] = []) {
  if (resource === "news") return listAgentNews(filters, permissions);
  if (resource === "jobs") return listAgentJobs(filters, permissions);
  if (resource === "candidates") return listAgentCandidates(filters, permissions);
  if (resource === "investments") return listAgentInvestments(filters, permissions);
  if (resource === "blog") return listAgentBlog(filters, permissions);
  if (resource === "affiliations") return listAgentAffiliations(filters, permissions);
  throw new Error("Unsupported resource");
}

export async function runAgentQuery(input: unknown, permissions: string[] = []) {
  const query = validateAgentQuery(input);
  return listAgentResource(query.table as AgentResource, query.filters as JsonObject | undefined ?? {}, permissions);
}

export async function listAgentInbox(filters: JsonObject = {}) {
  const conditions: SQL[] = [];
  if (typeof filters.status === "string") conditions.push(eq(agentInboxSubmissions.status, filters.status));
  if (typeof filters.kind === "string") conditions.push(eq(agentInboxSubmissions.kind, filters.kind));

  const limit = toLimit(filters.limit);
  const rows = await db
    .select()
    .from(agentInboxSubmissions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(agentInboxSubmissions.createdAt))
    .limit(limit)
    .offset(toOffset(filters.offset));
  return { data: rows, meta: { limit } };
}

export async function getAgentSubmission(id: string) {
  const [submission] = await db
    .select()
    .from(agentInboxSubmissions)
    .where(eq(agentInboxSubmissions.id, id))
    .limit(1);
  if (!submission) return null;
  const comments = await db
    .select()
    .from(agentInboxComments)
    .where(eq(agentInboxComments.submissionId, id))
    .orderBy(desc(agentInboxComments.createdAt));
  return { ...submission, comments };
}

export async function createAgentSubmissionFromRequest(kind: string, request: Request, auth?: AuthResult) {
  const normalizedKind = normalizeKind(kind);
  if (!normalizedKind) throw new AgentHttpError(400, "Unsupported submission kind");
  const payload = await request.json().catch(() => ({}));
  const actor = await resolveSubmissionActor(request, auth, normalizedKind);
  return createAgentSubmission(normalizedKind, payload, actor);
}

export async function createAgentSubmission(kind: AgentKind, payload: unknown, actor: AgentActor) {
  const now = new Date();
  const title = inferSubmissionTitle(kind, payload);
  const [submission] = await db
    .insert(agentInboxSubmissions)
    .values({
      kind,
      status: "pending",
      priority: actor.priority,
      submitterType: actor.type,
      submitterName: actor.type === "submit_token" ? actor.submitterName : actor.type === "api_key" ? actor.name : null,
      submitterEmail: actor.type === "submit_token" ? actor.submitterEmail : null,
      submitTokenId: actor.type === "submit_token" ? actor.tokenId : null,
      createdByKeyId: actor.type === "api_key" ? actor.keyId : null,
      title,
      originalPayload: payload,
      currentPayload: payload,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await auditAgentEvent({
    actor,
    action: "submission.created",
    targetType: "agent_inbox_submission",
    targetId: submission.id,
    metadata: { kind },
  });
  await notifyAgentSubmission(submission);
  return submission;
}

export async function commentAgentSubmission(id: string, body: unknown, auth: Extract<AuthResult, { valid: true }>) {
  const commentBody = typeof body === "string" ? body : String((body as JsonObject)?.body ?? "");
  if (!commentBody.trim()) throw new AgentHttpError(400, "Comment body is required");
  const [comment] = await db
    .insert(agentInboxComments)
    .values({
      submissionId: id,
      authorType: "admin",
      authorName: auth.name,
      authorKeyId: auth.keyId,
      body: commentBody,
    })
    .returning();
  await auditAgentEvent({
    actor: apiKeyActor(auth),
    action: "submission.comment.created",
    targetType: "agent_inbox_submission",
    targetId: id,
    metadata: { commentId: comment.id },
  });
  return comment;
}

export async function approveAgentSubmission(id: string, input: unknown, auth?: Extract<AuthResult, { valid: true }>) {
  const [submission] = await db
    .select()
    .from(agentInboxSubmissions)
    .where(eq(agentInboxSubmissions.id, id))
    .limit(1);
  if (!submission) throw new AgentHttpError(404, "Submission not found");
  if (submission.status !== "pending") throw new AgentHttpError(409, "Only pending submissions can be approved");

  const body = (input && typeof input === "object" ? input : {}) as JsonObject;
  const finalPayload = body.payload && typeof body.payload === "object" ? body.payload : submission.currentPayload;
  const liveRecord = await publishApprovedSubmission(submission.kind, finalPayload as JsonObject);
  const liveRecordId = typeof (liveRecord as JsonObject).id === "string" ? String((liveRecord as JsonObject).id) : null;
  const now = new Date();

  await db.insert(agentInboxVersions).values({
    submissionId: id,
    payload: finalPayload,
    changedByKeyId: auth?.keyId,
    changedByName: auth?.name,
    changeNote: typeof body.note === "string" ? body.note : "Approved",
  });

  const [updated] = await db
    .update(agentInboxSubmissions)
    .set({
      status: "approved",
      currentPayload: finalPayload,
      liveRecordId,
      approvedByKeyId: auth?.keyId,
      approvedByName: auth?.name,
      approvedAt: now,
      updatedAt: now,
    })
    .where(eq(agentInboxSubmissions.id, id))
    .returning();

  await auditAgentEvent({
    actor: auth ? apiKeyActor(auth) : { type: "public", priority: "low", permissions: [] },
    action: "submission.approved",
    targetType: "agent_inbox_submission",
    targetId: id,
    metadata: { liveRecordId: updated.liveRecordId, kind: submission.kind },
  });
  return updated;
}

export async function rejectAgentSubmission(id: string, input: unknown, auth: Extract<AuthResult, { valid: true }>) {
  const reason = input && typeof input === "object" && typeof (input as JsonObject).reason === "string"
    ? String((input as JsonObject).reason)
    : null;
  const [updated] = await db
    .update(agentInboxSubmissions)
    .set({
      status: "rejected",
      rejectedByKeyId: auth.keyId,
      rejectedByName: auth.name,
      rejectedAt: new Date(),
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(agentInboxSubmissions.id, id))
    .returning();
  if (!updated) throw new AgentHttpError(404, "Submission not found");
  await auditAgentEvent({
    actor: apiKeyActor(auth),
    action: "submission.rejected",
    targetType: "agent_inbox_submission",
    targetId: id,
    metadata: { reason },
  });
  return updated;
}

export async function createAgentInvite(input: unknown, auth: Extract<AuthResult, { valid: true }>) {
  const invite = parseAgentInviteInput(input);
  const token = randomBytes(24).toString("base64url");
  const [row] = await db
    .insert(agentSubmitTokens)
    .values({
      tokenHash: hashToken(token),
      label: invite.label,
      submitterName: invite.submitterName,
      submitterEmail: invite.submitterEmail,
      allowedKinds: invite.allowedKinds,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
      createdByKeyId: auth.keyId,
    })
    .returning();
  await auditAgentEvent({
    actor: apiKeyActor(auth),
    action: "submit_token.created",
    targetType: "agent_submit_token",
    targetId: row.id,
    metadata: { allowedKinds: invite.allowedKinds, expiresAt: invite.expiresAt.toISOString(), maxUses: invite.maxUses },
  });
  return {
    ...row,
    token,
    url: `/agent/submit?token=${encodeURIComponent(token)}`,
  };
}

export function parseAgentInviteInput(input: unknown) {
  const body = input && typeof input === "object" ? (input as JsonObject) : {};
  const rawKinds = Array.isArray(body.allowedKinds) ? body.allowedKinds : AGENT_KINDS;
  const allowedKinds = rawKinds.map((kind) => normalizeKind(String(kind))).filter((kind): kind is AgentKind => Boolean(kind));
  if (allowedKinds.length === 0) throw new AgentHttpError(400, "Invite requires at least one allowed submission kind");

  const expiresInDays = clampInteger(body.expiresInDays, 30, 1, 365);
  const maxUses = body.maxUses === undefined || body.maxUses === null
    ? null
    : clampInteger(body.maxUses, 1, 1, 1000);

  return {
    label: String(body.label ?? "Scoped submit token").slice(0, 160),
    submitterName: typeof body.submitterName === "string" ? body.submitterName.slice(0, 160) : null,
    submitterEmail: typeof body.submitterEmail === "string" ? body.submitterEmail.slice(0, 320) : null,
    allowedKinds: [...new Set(allowedKinds)],
    expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
    maxUses,
  };
}

export async function refreshAgentSearchDocuments(resource?: string) {
  const indexedAt = new Date();
  await auditAgentEvent({
    actor: { type: "public", priority: "low", permissions: [] },
    action: "search.refresh.requested",
    targetType: "agent_search_documents",
    metadata: { resource: resource ?? "all", embeddingProvider: process.env.AGENT_EMBEDDING_PROVIDER ?? null },
  });
  return {
    ok: true,
    indexedAt,
    semanticEnabled: Boolean(process.env.AGENT_EMBEDDING_PROVIDER),
    provider: process.env.AGENT_EMBEDDING_PROVIDER ?? null,
  };
}

export class AgentHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AgentHttpError";
  }
}

async function listAgentJobs(filters: JsonObject, permissions: string[]) {
  const conditions: SQL[] = [];
  const text = String(filters.q ?? filters.query ?? "").trim();
  if (text) conditions.push(or(ilike(jobs.title, `%${text}%`), ilike(jobs.company, `%${text}%`), ilike(jobs.description, `%${text}%`))!);
  if (typeof filters.company === "string") conditions.push(eq(jobs.company, filters.company));
  if (typeof filters.category === "string") conditions.push(eq(jobs.category, filters.category));
  if (typeof filters.remote === "boolean") conditions.push(eq(jobs.remote, filters.remote ? "Remote" : "On-site"));
  if (Array.isArray(filters.tags) && filters.tags.length) conditions.push(arrayOverlaps(jobs.tags, filters.tags.map(String)));
  const rows = await db.select().from(jobs).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(jobs.featured), desc(jobs.createdAt)).limit(toLimit(filters.limit)).offset(toOffset(filters.offset));
  return { data: rows.map((row) => redactAgentRecord("jobs", row as JsonObject, permissions)), meta: { limit: toLimit(filters.limit), semantic: semanticMeta() } };
}

async function listAgentCandidates(filters: JsonObject, permissions: string[]) {
  const conditions: SQL[] = [];
  const text = String(filters.q ?? filters.query ?? "").trim();
  if (text) conditions.push(or(ilike(candidates.name, `%${text}%`), ilike(candidates.title, `%${text}%`), ilike(candidates.summary, `%${text}%`))!);
  if (typeof filters.location === "string") conditions.push(ilike(candidates.location, `%${filters.location}%`));
  if (typeof filters.availability === "string") conditions.push(eq(candidates.availability, filters.availability));
  if (Array.isArray(filters.tags) && filters.tags.length) conditions.push(arrayOverlaps(candidates.skills, filters.tags.map(String)));
  const rows = await db.select().from(candidates).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(candidates.featured), desc(candidates.createdAt)).limit(toLimit(filters.limit)).offset(toOffset(filters.offset));
  return { data: rows.map((row) => redactAgentRecord("candidates", row as JsonObject, permissions)), meta: { limit: toLimit(filters.limit), semantic: semanticMeta() } };
}

async function listAgentNews(filters: JsonObject, permissions: string[]) {
  const since = parseSince(filters.since);
  const curatedConditions: SQL[] = [];
  const announcementConditions: SQL[] = [];
  if (since) {
    curatedConditions.push(gte(curatedLinks.date, since));
    announcementConditions.push(gte(announcements.date, since));
  }
  if (typeof filters.category === "string") {
    curatedConditions.push(eq(curatedLinks.category, filters.category));
    announcementConditions.push(eq(announcements.category, filters.category));
  }
  const [curated, announce] = await Promise.all([
    db.select().from(curatedLinks).where(curatedConditions.length ? and(...curatedConditions) : undefined).orderBy(desc(curatedLinks.date)).limit(toLimit(filters.limit)),
    db.select().from(announcements).where(announcementConditions.length ? and(...announcementConditions) : undefined).orderBy(desc(announcements.date)).limit(toLimit(filters.limit)),
  ]);
  const data = [
    ...curated.map((row) => ({ ...row, type: "curated" })),
    ...announce.map((row) => ({ ...row, type: "announcement" })),
  ]
    .sort((a, b) => Number(new Date((b as { date: Date }).date)) - Number(new Date((a as { date: Date }).date)))
    .slice(0, toLimit(filters.limit))
    .map((row) => redactAgentRecord("news", row as JsonObject, permissions));
  return { data, meta: { limit: toLimit(filters.limit), semantic: semanticMeta() } };
}

async function listAgentInvestments(filters: JsonObject, permissions: string[]) {
  const rows = await db.select().from(investments).orderBy(desc(investments.featured), investments.title).limit(toLimit(filters.limit)).offset(toOffset(filters.offset));
  return { data: rows.map((row) => redactAgentRecord("investments", row as JsonObject, permissions)), meta: { limit: toLimit(filters.limit) } };
}

async function listAgentBlog(filters: JsonObject, permissions: string[]) {
  const rows = await db.select().from(blogPosts).where(eq(blogPosts.published, true)).orderBy(desc(blogPosts.date)).limit(toLimit(filters.limit)).offset(toOffset(filters.offset));
  return { data: rows.map((row) => redactAgentRecord("blog", row as JsonObject, permissions)), meta: { limit: toLimit(filters.limit) } };
}

async function listAgentAffiliations(filters: JsonObject, permissions: string[]) {
  const rows = await db.select().from(affiliations).orderBy(desc(affiliations.createdAt)).limit(toLimit(filters.limit)).offset(toOffset(filters.offset));
  return { data: rows.map((row) => redactAgentRecord("affiliations", row as JsonObject, permissions)), meta: { limit: toLimit(filters.limit) } };
}

async function publishApprovedSubmission(kind: string, payload: JsonObject) {
  if (kind === "job") {
    validateJobPayload(payload);
    const [row] = await db.insert(jobs).values(payload as NewJob).returning();
    return row;
  }
  if (kind === "candidate") {
    if (!payload.name) throw new AgentHttpError(400, "Candidate submissions require name");
    const [row] = await db.insert(candidates).values(payload as NewCandidate).returning();
    return row;
  }
  return { id: null, kind: "message" };
}

function validateJobPayload(payload: JsonObject) {
  for (const field of ["title", "company", "link", "category"]) {
    if (!payload[field]) throw new AgentHttpError(400, `Job submissions require ${field}`);
  }
}

async function resolveSubmissionActor(request: Request, auth: AuthResult | undefined, kind: AgentKind): Promise<AgentActor> {
  if (auth?.valid) return apiKeyActor(auth);
  if (kind === "message" && !extractRequestToken(request)) {
    return { type: "public", priority: "low", permissions: [] };
  }

  const token = extractRequestToken(request);
  if (!token) throw new AgentHttpError(401, "Missing submit token");
  const [submitToken] = await db.select().from(agentSubmitTokens).where(eq(agentSubmitTokens.tokenHash, hashToken(token))).limit(1);
  if (!submitToken || !submitToken.active || submitToken.expiresAt < new Date()) {
    throw new AgentHttpError(401, "Invalid or expired submit token");
  }
  if (submitToken.maxUses !== null && submitToken.useCount >= submitToken.maxUses) {
    throw new AgentHttpError(403, "Submit token use limit reached");
  }
  if (!submitToken.allowedKinds.includes(kind)) {
    throw new AgentHttpError(403, `Submit token cannot create ${kind} submissions`);
  }
  await db.update(agentSubmitTokens).set({ useCount: Number(submitToken.useCount || 0) + 1, updatedAt: new Date() }).where(eq(agentSubmitTokens.id, submitToken.id));
  return {
    type: "submit_token",
    tokenId: submitToken.id,
    submitterName: submitToken.submitterName,
    submitterEmail: submitToken.submitterEmail,
    allowedKinds: submitToken.allowedKinds,
    permissions: [],
    priority: "normal",
  };
}

async function auditAgentEvent(input: {
  actor: AgentActor;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: unknown;
}) {
  await db.insert(agentAuditEvents).values({
    actorType: input.actor.type === "api_key" ? "api_key" : input.actor.type === "submit_token" ? "submit_token" : "public",
    actorKeyId: input.actor.type === "api_key" ? input.actor.keyId : null,
    actorName: input.actor.type === "api_key" ? input.actor.name : input.actor.type === "submit_token" ? input.actor.submitterName : null,
    submitTokenId: input.actor.type === "submit_token" ? input.actor.tokenId : null,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata,
  });
}

async function notifyAgentSubmission(submission: { id: string; kind: string; title: string | null; priority: string }) {
  const to = process.env.AGENT_INBOX_NOTIFY_EMAIL || process.env.NEWSLETTER_REPLY_TO;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  if (!to || !apiKey || !from) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New ${submission.kind} inbox submission`,
      html: `<p>New ${submission.priority} priority submission: ${escapeHtml(submission.title || submission.id)}</p>`,
      text: `New ${submission.priority} priority ${submission.kind} submission: ${submission.title || submission.id}`,
    }),
  }).catch((error) => console.warn("[agent-inbox] notification failed", error));
}

function apiKeyActor(auth: Extract<AuthResult, { valid: true }>): AgentActor {
  return { type: "api_key", keyId: auth.keyId, name: auth.name, permissions: auth.permissions ?? [], priority: "normal" };
}

function canReadSensitive(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("admin:read") || permissions.includes("agent:sensitive");
}

function normalizeKind(kind: string): AgentKind | null {
  return AGENT_KINDS.includes(kind as AgentKind) ? (kind as AgentKind) : null;
}

function normalizeResource(value: string): AgentResource | null {
  const resource = value === "curated" || value === "announcements" ? "news" : value;
  return ["news", "jobs", "candidates", "investments", "blog", "affiliations"].includes(resource)
    ? (resource as AgentResource)
    : null;
}

function inferSubmissionTitle(kind: AgentKind, payload: unknown) {
  if (!payload || typeof payload !== "object") return kind;
  const body = payload as JsonObject;
  return String(body.title ?? body.name ?? body.subject ?? body.message ?? kind).slice(0, 180);
}

function toLimit(value: unknown) {
  const parsed = Number(value ?? 50);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 200) : 50;
}

function toOffset(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function parseSince(value: unknown) {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d+)d$/);
  if (match) return new Date(Date.now() - Number(match[1]) * 24 * 60 * 60 * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function semanticMeta() {
  return {
    enabled: Boolean(process.env.AGENT_EMBEDDING_PROVIDER),
    provider: process.env.AGENT_EMBEDDING_PROVIDER ?? null,
    fallback: process.env.AGENT_EMBEDDING_PROVIDER ? null : "text",
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
