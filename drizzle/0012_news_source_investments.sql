CREATE TABLE "news_source_investments" (
  "id" text PRIMARY KEY NOT NULL,
  "source_type" text NOT NULL,
  "source_value" text NOT NULL,
  "source_kind" text DEFAULT 'person' NOT NULL,
  "investment_id" text NOT NULL REFERENCES "investments"("id") ON DELETE cascade,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "news_source_investments_source_unique"
  ON "news_source_investments" ("source_type", "source_value");

CREATE INDEX "news_source_investments_investment_idx"
  ON "news_source_investments" ("investment_id");

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'benjamin-fels-x-octet', 'x_handle', 'benjamintfels', 'person', "id"
FROM "investments"
WHERE "title" = 'Octet'
ON CONFLICT ("source_type", "source_value") DO NOTHING;

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'benjamin-fels-substack-octet', 'blog_host', 'benjaminfels.substack.com', 'person', "id"
FROM "investments"
WHERE "title" = 'Octet'
ON CONFLICT ("source_type", "source_value") DO NOTHING;

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'prime-intellect-x-prime-intellect', 'x_handle', 'primeintellect', 'company', "id"
FROM "investments"
WHERE "title" = 'Prime Intellect'
ON CONFLICT ("source_type", "source_value") DO NOTHING;

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'succinct-x-succinct', 'x_handle', 'succinctlabs', 'company', "id"
FROM "investments"
WHERE "title" = 'Succinct'
ON CONFLICT ("source_type", "source_value") DO NOTHING;

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'megaeth-x-megaeth', 'x_handle', 'megaeth', 'company', "id"
FROM "investments"
WHERE "title" = 'MegaETH'
ON CONFLICT ("source_type", "source_value") DO NOTHING;

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'praxis-x-praxis', 'x_handle', 'praxisnation', 'company', "id"
FROM "investments"
WHERE "title" = 'Praxis'
ON CONFLICT ("source_type", "source_value") DO NOTHING;

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'morpho-x-morpho', 'x_handle', 'morpho', 'company', "id"
FROM "investments"
WHERE "title" = 'Morpho'
ON CONFLICT ("source_type", "source_value") DO NOTHING;

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'aligned-layer-x-aligned-layer', 'x_handle', 'alignedlayer', 'company', "id"
FROM "investments"
WHERE "title" = 'Aligned Layer'
ON CONFLICT ("source_type", "source_value") DO NOTHING;

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'giza-x-giza', 'x_handle', 'gizatechxyz', 'company', "id"
FROM "investments"
WHERE "title" = 'Giza'
ON CONFLICT ("source_type", "source_value") DO NOTHING;

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'gashawk-x-gashawk', 'x_handle', '0xknoxfi', 'company', "id"
FROM "investments"
WHERE "title" = 'GasHawk'
ON CONFLICT ("source_type", "source_value") DO NOTHING;

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'lighter-x-lighter', 'x_handle', 'lighter_xyz', 'company', "id"
FROM "investments"
WHERE "title" = 'Lighter'
ON CONFLICT ("source_type", "source_value") DO NOTHING;

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'avi-schiffmann-x-friend', 'x_handle', 'avischiffmann', 'person', "id"
FROM "investments"
WHERE "title" = 'Friend'
ON CONFLICT ("source_type", "source_value") DO NOTHING;
