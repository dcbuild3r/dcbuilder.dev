ALTER TABLE "curated_links"
  ADD COLUMN "relevance" integer NOT NULL DEFAULT 5;

ALTER TABLE "announcements"
  ADD COLUMN "relevance" integer NOT NULL DEFAULT 5;

ALTER TABLE "blog_posts"
  ADD COLUMN "relevance" integer NOT NULL DEFAULT 5;

ALTER TABLE "newsletter_campaigns"
  ADD COLUMN "timeframe_preset" text NOT NULL DEFAULT 'weekly',
  ADD COLUMN "minimum_relevance" integer NOT NULL DEFAULT 1;
