CREATE TABLE "affiliations" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"role" text NOT NULL,
	"date_begin" text,
	"date_end" text,
	"description" text,
	"image_url" text,
	"logo" text,
	"website" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"company" text NOT NULL,
	"company_logo" text,
	"platform" text NOT NULL,
	"date" timestamp NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"permissions" text[],
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content" text NOT NULL,
	"date" timestamp NOT NULL,
	"source" text,
	"source_url" text,
	"image" text,
	"published" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"location" text,
	"summary" text,
	"skills" text[],
	"experience" text,
	"education" text,
	"image" text,
	"cv" text,
	"featured" boolean DEFAULT false,
	"availability" text DEFAULT 'looking',
	"email" text,
	"telegram" text,
	"calendly" text,
	"x" text,
	"github" text,
	"linkedin" text,
	"website" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curated_links" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"source" text NOT NULL,
	"date" timestamp NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"logo" text,
	"tier" text,
	"featured" boolean DEFAULT false,
	"status" text DEFAULT 'active',
	"website" text,
	"x" text,
	"github" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"company_logo" text,
	"link" text NOT NULL,
	"location" text,
	"remote" text,
	"type" text,
	"salary" text,
	"department" text,
	"tags" text[],
	"category" text NOT NULL,
	"featured" boolean DEFAULT false,
	"description" text,
	"responsibilities" text[],
	"qualifications" text[],
	"benefits" text[],
	"company_website" text,
	"company_x" text,
	"company_github" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "affiliations_title_idx" ON "affiliations" USING btree ("title");--> statement-breakpoint
CREATE INDEX "announcements_company_idx" ON "announcements" USING btree ("company");--> statement-breakpoint
CREATE INDEX "announcements_date_idx" ON "announcements" USING btree ("date");--> statement-breakpoint
CREATE INDEX "api_keys_key_idx" ON "api_keys" USING btree ("key");--> statement-breakpoint
CREATE INDEX "blog_posts_date_idx" ON "blog_posts" USING btree ("date");--> statement-breakpoint
CREATE INDEX "blog_posts_published_idx" ON "blog_posts" USING btree ("published");--> statement-breakpoint
CREATE INDEX "candidates_featured_idx" ON "candidates" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "candidates_availability_idx" ON "candidates" USING btree ("availability");--> statement-breakpoint
CREATE INDEX "curated_links_category_idx" ON "curated_links" USING btree ("category");--> statement-breakpoint
CREATE INDEX "curated_links_date_idx" ON "curated_links" USING btree ("date");--> statement-breakpoint
CREATE INDEX "investments_tier_idx" ON "investments" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "investments_featured_idx" ON "investments" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "jobs_company_idx" ON "jobs" USING btree ("company");--> statement-breakpoint
CREATE INDEX "jobs_category_idx" ON "jobs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "jobs_featured_idx" ON "jobs" USING btree ("featured");