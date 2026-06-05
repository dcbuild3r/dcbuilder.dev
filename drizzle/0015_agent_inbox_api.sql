CREATE TABLE "agent_submit_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"label" text NOT NULL,
	"submitter_name" text,
	"submitter_email" text,
	"allowed_kinds" text[] NOT NULL,
	"expires_at" timestamp NOT NULL,
	"max_uses" integer,
	"use_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by_key_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_inbox_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"submitter_type" text DEFAULT 'public' NOT NULL,
	"submitter_name" text,
	"submitter_email" text,
	"submit_token_id" text,
	"created_by_key_id" text,
	"title" text,
	"original_payload" jsonb NOT NULL,
	"current_payload" jsonb NOT NULL,
	"live_record_id" text,
	"approved_by_key_id" text,
	"approved_by_name" text,
	"approved_at" timestamp,
	"rejected_by_key_id" text,
	"rejected_by_name" text,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_inbox_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"author_type" text NOT NULL,
	"author_name" text,
	"author_key_id" text,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_inbox_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"changed_by_key_id" text,
	"changed_by_name" text,
	"change_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_type" text NOT NULL,
	"actor_key_id" text,
	"actor_name" text,
	"submit_token_id" text,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_search_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"search_text" text NOT NULL,
	"embedding_provider" text,
	"embedding_model" text,
	"embedding_json" jsonb,
	"indexed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "agent_submit_tokens_hash_uidx" ON "agent_submit_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "agent_submit_tokens_active_idx" ON "agent_submit_tokens" USING btree ("active");--> statement-breakpoint
CREATE INDEX "agent_submit_tokens_expires_idx" ON "agent_submit_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "agent_inbox_submissions_status_idx" ON "agent_inbox_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_inbox_submissions_kind_idx" ON "agent_inbox_submissions" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "agent_inbox_submissions_priority_idx" ON "agent_inbox_submissions" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "agent_inbox_submissions_created_idx" ON "agent_inbox_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agent_inbox_comments_submission_idx" ON "agent_inbox_comments" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "agent_inbox_versions_submission_idx" ON "agent_inbox_versions" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "agent_audit_events_target_idx" ON "agent_audit_events" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "agent_audit_events_action_idx" ON "agent_audit_events" USING btree ("action");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_search_documents_resource_uidx" ON "agent_search_documents" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "agent_search_documents_resource_type_idx" ON "agent_search_documents" USING btree ("resource_type");
