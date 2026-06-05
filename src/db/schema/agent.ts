import { createId } from "@paralleldrive/cuid2";
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const agentSubmitTokens = pgTable(
  "agent_submit_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    tokenHash: text("token_hash").notNull(),
    label: text("label").notNull(),
    submitterName: text("submitter_name"),
    submitterEmail: text("submitter_email"),
    allowedKinds: text("allowed_kinds").array().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    maxUses: integer("max_uses"),
    useCount: integer("use_count").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdByKeyId: text("created_by_key_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("agent_submit_tokens_hash_uidx").on(table.tokenHash),
    index("agent_submit_tokens_active_idx").on(table.active),
    index("agent_submit_tokens_expires_idx").on(table.expiresAt),
  ],
);

export const agentInboxSubmissions = pgTable(
  "agent_inbox_submissions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    kind: text("kind").notNull(), // job | candidate | message
    status: text("status").notNull().default("pending"), // pending | approved | rejected
    priority: text("priority").notNull().default("normal"), // low | normal | high
    submitterType: text("submitter_type").notNull().default("public"), // public | token | api_key
    submitterName: text("submitter_name"),
    submitterEmail: text("submitter_email"),
    submitTokenId: text("submit_token_id"),
    createdByKeyId: text("created_by_key_id"),
    title: text("title"),
    originalPayload: jsonb("original_payload").notNull(),
    currentPayload: jsonb("current_payload").notNull(),
    liveRecordId: text("live_record_id"),
    approvedByKeyId: text("approved_by_key_id"),
    approvedByName: text("approved_by_name"),
    approvedAt: timestamp("approved_at"),
    rejectedByKeyId: text("rejected_by_key_id"),
    rejectedByName: text("rejected_by_name"),
    rejectedAt: timestamp("rejected_at"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("agent_inbox_submissions_status_idx").on(table.status),
    index("agent_inbox_submissions_kind_idx").on(table.kind),
    index("agent_inbox_submissions_priority_idx").on(table.priority),
    index("agent_inbox_submissions_created_idx").on(table.createdAt),
  ],
);

export const agentInboxComments = pgTable(
  "agent_inbox_comments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    submissionId: text("submission_id").notNull(),
    authorType: text("author_type").notNull(), // public | submitter | api_key | admin
    authorName: text("author_name"),
    authorKeyId: text("author_key_id"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("agent_inbox_comments_submission_idx").on(table.submissionId)],
);

export const agentInboxVersions = pgTable(
  "agent_inbox_versions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    submissionId: text("submission_id").notNull(),
    payload: jsonb("payload").notNull(),
    changedByKeyId: text("changed_by_key_id"),
    changedByName: text("changed_by_name"),
    changeNote: text("change_note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("agent_inbox_versions_submission_idx").on(table.submissionId)],
);

export const agentAuditEvents = pgTable(
  "agent_audit_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    actorType: text("actor_type").notNull(), // public | submit_token | api_key | admin | system
    actorKeyId: text("actor_key_id"),
    actorName: text("actor_name"),
    submitTokenId: text("submit_token_id"),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("agent_audit_events_target_idx").on(table.targetType, table.targetId),
    index("agent_audit_events_action_idx").on(table.action),
  ],
);

export const agentSearchDocuments = pgTable(
  "agent_search_documents",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    resourceType: text("resource_type").notNull(), // jobs | candidates | news | investments | blog | affiliations
    resourceId: text("resource_id").notNull(),
    searchText: text("search_text").notNull(),
    embeddingProvider: text("embedding_provider"),
    embeddingModel: text("embedding_model"),
    embeddingJson: jsonb("embedding_json"),
    indexedAt: timestamp("indexed_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("agent_search_documents_resource_uidx").on(table.resourceType, table.resourceId),
    index("agent_search_documents_resource_type_idx").on(table.resourceType),
  ],
);

export type AgentSubmitToken = typeof agentSubmitTokens.$inferSelect;
export type NewAgentSubmitToken = typeof agentSubmitTokens.$inferInsert;
export type AgentInboxSubmission = typeof agentInboxSubmissions.$inferSelect;
export type NewAgentInboxSubmission = typeof agentInboxSubmissions.$inferInsert;
export type AgentInboxComment = typeof agentInboxComments.$inferSelect;
export type NewAgentInboxComment = typeof agentInboxComments.$inferInsert;
