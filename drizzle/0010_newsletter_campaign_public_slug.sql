ALTER TABLE "newsletter_campaigns"
  ADD COLUMN "public_slug" text;

WITH prepared_campaign_slugs AS (
  SELECT
    "id",
    CONCAT(
      COALESCE(
        NULLIF(
          TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER("subject"), '[^a-z0-9]+', '-', 'g')),
          ''
        ),
        'newsletter'
      ),
      '-',
      TO_CHAR(TIMEZONE('UTC', COALESCE("sent_at", "scheduled_at", "created_at")), 'YYYY-MM-DD')
    ) AS "base_slug",
    COALESCE("sent_at", "scheduled_at", "created_at") AS "anchor_at"
  FROM "newsletter_campaigns"
),
ranked_campaign_slugs AS (
  SELECT
    "id",
    "base_slug",
    ROW_NUMBER() OVER (
      PARTITION BY "base_slug"
      ORDER BY "anchor_at", "id"
    ) AS "slug_rank"
  FROM prepared_campaign_slugs
)
UPDATE "newsletter_campaigns" AS "campaigns"
SET "public_slug" = CASE
  WHEN ranked_campaign_slugs."slug_rank" = 1 THEN ranked_campaign_slugs."base_slug"
  ELSE CONCAT(ranked_campaign_slugs."base_slug", '-', ranked_campaign_slugs."slug_rank")
END
FROM ranked_campaign_slugs
WHERE "campaigns"."id" = ranked_campaign_slugs."id";

ALTER TABLE "newsletter_campaigns"
  ALTER COLUMN "public_slug" SET NOT NULL;

CREATE UNIQUE INDEX "newsletter_campaigns_public_slug_uidx"
  ON "newsletter_campaigns" USING btree ("public_slug");
