CREATE TABLE "newsletter_campaign_recipients" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"subscriber_id" text NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"newsletter_type" text NOT NULL,
	"subject" text NOT NULL,
	"preview_text" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"period_days" integer DEFAULT 7 NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"failure_reason" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriber_id" text NOT NULL,
	"newsletter_type" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_send_events" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"recipient_id" text,
	"event_type" text NOT NULL,
	"provider" text,
	"provider_message_id" text,
	"payload" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"confirmed_at" timestamp,
	"unsubscribed_at" timestamp,
	"source" text DEFAULT 'news-page' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "newsletter_unsub_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"subscriber_id" text NOT NULL,
	"newsletter_type" text,
	"token_type" text DEFAULT 'unsubscribe' NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_unsub_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "curated_links" ADD COLUMN "source_image" text;--> statement-breakpoint
CREATE INDEX "newsletter_campaign_recipients_campaign_idx" ON "newsletter_campaign_recipients" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "newsletter_campaign_recipients_subscriber_idx" ON "newsletter_campaign_recipients" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_status_idx" ON "newsletter_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_type_idx" ON "newsletter_campaigns" USING btree ("newsletter_type");--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_scheduled_idx" ON "newsletter_campaigns" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "newsletter_preferences_subscriber_idx" ON "newsletter_preferences" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX "newsletter_preferences_type_idx" ON "newsletter_preferences" USING btree ("newsletter_type");--> statement-breakpoint
CREATE INDEX "newsletter_send_events_campaign_idx" ON "newsletter_send_events" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "newsletter_send_events_type_idx" ON "newsletter_send_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "newsletter_unsub_tokens_subscriber_idx" ON "newsletter_unsub_tokens" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX "newsletter_unsub_tokens_token_idx" ON "newsletter_unsub_tokens" USING btree ("token");