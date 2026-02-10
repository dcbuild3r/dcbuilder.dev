CREATE TABLE "newsletter_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"newsletter_type" text NOT NULL,
	"subject_template" text NOT NULL,
	"html_template" text NOT NULL,
	"text_template" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_templates_newsletter_type_unique" UNIQUE("newsletter_type")
);
--> statement-breakpoint
CREATE INDEX "newsletter_templates_type_idx" ON "newsletter_templates" USING btree ("newsletter_type");