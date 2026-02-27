ALTER TABLE "newsletter_campaigns" ADD COLUMN "content_mode" text DEFAULT 'template' NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD COLUMN "markdown_content" text;--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD COLUMN "manual_html" text;--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD COLUMN "manual_text" text;--> statement-breakpoint
ALTER TABLE "newsletter_templates" ADD COLUMN "markdown_template" text DEFAULT '{{default_markdown_body}}' NOT NULL;