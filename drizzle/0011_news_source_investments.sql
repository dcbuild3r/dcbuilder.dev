CREATE TABLE "news_source_investments" (
  "id" text PRIMARY KEY NOT NULL,
  "source_type" text NOT NULL,
  "source_value" text NOT NULL,
  "investment_id" text NOT NULL REFERENCES "investments"("id") ON DELETE cascade,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "news_source_investments_source_unique"
  ON "news_source_investments" ("source_type", "source_value");

CREATE INDEX "news_source_investments_investment_idx"
  ON "news_source_investments" ("investment_id");

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "investment_id")
SELECT 'benjamin-fels-x-octet', 'x_handle', 'benjamintfels', "id"
FROM "investments"
WHERE "title" = 'Octet'
ON CONFLICT ("source_type", "source_value") DO NOTHING;

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "investment_id")
SELECT 'benjamin-fels-substack-octet', 'blog_host', 'benjaminfels.substack.com', "id"
FROM "investments"
WHERE "title" = 'Octet'
ON CONFLICT ("source_type", "source_value") DO NOTHING;
