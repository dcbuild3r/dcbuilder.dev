ALTER TABLE "blog_posts"
  ADD COLUMN IF NOT EXISTS "relevance" integer DEFAULT 5 NOT NULL;

ALTER TABLE "curated_links"
  ADD COLUMN IF NOT EXISTS "relevance" integer DEFAULT 5 NOT NULL;

ALTER TABLE "announcements"
  ADD COLUMN IF NOT EXISTS "relevance" integer DEFAULT 5 NOT NULL;
