ALTER TABLE "blog_posts" ADD COLUMN "is_fresh" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "is_fresh" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "curated_links" ADD COLUMN "source_image" text;--> statement-breakpoint
ALTER TABLE "curated_links" ADD COLUMN "is_fresh" boolean DEFAULT false NOT NULL;