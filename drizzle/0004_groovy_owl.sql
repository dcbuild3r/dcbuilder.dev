ALTER TABLE "blog_posts" ADD COLUMN "is_fresh" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "is_fresh" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "curated_links" ADD COLUMN "source_image" text;--> statement-breakpoint
ALTER TABLE "curated_links" ADD COLUMN "is_fresh" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "blog_posts"
SET "is_fresh" = ("date" > (timezone('UTC', now()) - interval '7 day'));--> statement-breakpoint
UPDATE "announcements"
SET "is_fresh" = ("date" > (timezone('UTC', now()) - interval '7 day'));--> statement-breakpoint
UPDATE "curated_links"
SET "is_fresh" = ("date" > (timezone('UTC', now()) - interval '7 day'));
