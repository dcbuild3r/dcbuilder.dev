ALTER TABLE "news_source_investments"
  ALTER COLUMN "investment_id" DROP NOT NULL;

ALTER TABLE "news_source_investments"
  ADD COLUMN "company_title" text,
  ADD COLUMN "company_logo" text,
  ADD COLUMN "company_website" text,
  ADD COLUMN "job_companies" text[];

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "company_title", "company_logo", "company_website", "job_companies")
VALUES
  ('daniel-shorr-x-world', 'x_handle', 'realdanielshorr', 'person', 'World', 'https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/world.png', 'https://world.org/', ARRAY['World']),
  ('remco-x-world', 'x_handle', 'recmo', 'person', 'World', 'https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/world.png', 'https://world.org/', ARRAY['World']),
  ('tiago-sada-x-world', 'x_handle', 'tiagosada', 'person', 'World', 'https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/world.png', 'https://world.org/', ARRAY['World']),
  ('andy-wang-x-world', 'x_handle', 'wangandyy', 'person', 'World', 'https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/world.png', 'https://world.org/', ARRAY['World']),
  ('dcbuilder-x-world', 'x_handle', 'dcbuilder', 'person', 'World', 'https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/world.png', 'https://world.org/', ARRAY['World']),
  ('worldnetwork-x-world', 'x_handle', 'worldnetwork', 'company', 'World', 'https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/world.png', 'https://world.org/', ARRAY['World']),
  ('world-chain-x-world', 'x_handle', 'world_chain_', 'company', 'World', 'https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/world.png', 'https://world.org/', ARRAY['World']),
  ('worldcoin-x-world', 'x_handle', 'worldcoin', 'company', 'World', 'https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/world.png', 'https://world.org/', ARRAY['World']),
  ('world-foundation-x-world', 'x_handle', 'worldfoundation', 'company', 'World', 'https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/world.png', 'https://world.org/', ARRAY['World']),
  ('tools-for-humanity-host-world', 'blog_host', 'toolsforhumanity.com', 'company', 'World', 'https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/world.png', 'https://world.org/', ARRAY['World']),
  ('yitong-x-runner', 'x_handle', 'yitong', 'person', 'Runner', 'https://runner.now/apple-touch-icon.png', 'https://runner.now/', ARRAY['Runner']),
  ('george-x-runner', 'x_handle', 'odysseus0z', 'person', 'Runner', 'https://runner.now/apple-touch-icon.png', 'https://runner.now/', ARRAY['Runner']),
  ('knox-x-knox', 'x_handle', '0xknoxfi', 'company', 'KNOX', 'https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/investments/gashawk.png', 'https://x.com/0xKnoxFi', ARRAY['KNOX', 'Knox', 'GasHawk'])
ON CONFLICT ("source_type", "source_value") DO UPDATE
SET
  "source_kind" = EXCLUDED."source_kind",
  "investment_id" = NULL,
  "company_title" = EXCLUDED."company_title",
  "company_logo" = EXCLUDED."company_logo",
  "company_website" = EXCLUDED."company_website",
  "job_companies" = EXCLUDED."job_companies",
  "updated_at" = now();

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'dryden-brown-x-praxis', 'x_handle', 'drydenwtbrown', 'person', "id"
FROM "investments"
WHERE "title" = 'Praxis'
ON CONFLICT ("source_type", "source_value") DO UPDATE
SET
  "source_kind" = EXCLUDED."source_kind",
  "investment_id" = EXCLUDED."investment_id",
  "company_title" = NULL,
  "company_logo" = NULL,
  "company_website" = NULL,
  "job_companies" = NULL,
  "updated_at" = now();

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'odysseus-x-phylax', 'x_handle', 'odysseas_eth', 'person', "id"
FROM "investments"
WHERE "title" = 'Phylax'
ON CONFLICT ("source_type", "source_value") DO UPDATE
SET
  "source_kind" = EXCLUDED."source_kind",
  "investment_id" = EXCLUDED."investment_id",
  "company_title" = NULL,
  "company_logo" = NULL,
  "company_website" = NULL,
  "job_companies" = NULL,
  "updated_at" = now();

INSERT INTO "news_source_investments" ("id", "source_type", "source_value", "source_kind", "investment_id")
SELECT 'eito-miyamura-x-edison', 'x_handle', 'eito_miyamura', 'person', "id"
FROM "investments"
WHERE "title" = 'Edison'
ON CONFLICT ("source_type", "source_value") DO UPDATE
SET
  "source_kind" = EXCLUDED."source_kind",
  "investment_id" = EXCLUDED."investment_id",
  "company_title" = NULL,
  "company_logo" = NULL,
  "company_website" = NULL,
  "job_companies" = NULL,
  "updated_at" = now();
