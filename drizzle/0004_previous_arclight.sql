ALTER TABLE "jobs" ADD COLUMN "source_board" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "source_external_id" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "last_checked_at" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "terminated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "terminated_at" timestamp;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "termination_reason" text;--> statement-breakpoint
ALTER TABLE "curated_links" ADD COLUMN "source_image" text;--> statement-breakpoint
CREATE INDEX "jobs_source_board_idx" ON "jobs" USING btree ("source_board");--> statement-breakpoint
CREATE INDEX "jobs_terminated_idx" ON "jobs" USING btree ("terminated");