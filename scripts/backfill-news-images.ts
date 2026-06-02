/**
 * Backfill: rehost externally-hosted news images (pbs.twimg.com, unavatar.io, etc.)
 * to our R2 bucket so /news only serves images from our own CDN.
 *
 * Usage:
 *   bun run scripts/backfill-news-images.ts --env=staging --dry-run
 *   bun run scripts/backfill-news-images.ts --env=staging
 *   bun run scripts/backfill-news-images.ts --env=prod
 *
 * Requires env vars: DATABASE_URL_STAGING or DATABASE_URL_PROD, plus R2_* creds.
 */

import postgres from "postgres";
import { S3Client } from "@aws-sdk/client-s3";
import {
  rehostAvatar,
  rehostCompanyLogo,
  isManagedImage,
  r2Client,
} from "../src/lib/r2-rehost";
import { createPreferredPostgresSocket } from "../src/db/postgres-connection";

type Env = "staging" | "prod";

function parseArgs(): { env: Env; dryRun: boolean; limit?: number } {
  const args = process.argv.slice(2);
  const envArg = args.find((a) => a.startsWith("--env="))?.slice(6) as Env | undefined;
  if (envArg !== "staging" && envArg !== "prod") {
    throw new Error("--env=staging|prod is required");
  }
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="))?.slice(8);
  return { env: envArg, dryRun, limit: limitArg ? Number(limitArg) : undefined };
}

function dbUrlFor(env: Env): string {
  const url = env === "prod" ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL_STAGING;
  if (!url) throw new Error(`DATABASE_URL_${env.toUpperCase()} is required`);
  return url;
}

interface CuratedRow {
  id: string;
  url: string;
  source: string;
  source_image: string;
}

interface AnnouncementRow {
  id: string;
  url: string;
  company: string;
  company_logo: string;
}

async function backfillCurated(
  sql: postgres.Sql,
  client: S3Client,
  dryRun: boolean,
  limit?: number,
): Promise<{ scanned: number; rehosted: number; skipped: number; failed: number }> {
  const rows = (await sql.unsafe<CuratedRow[]>(
    `
    select id, url, source, source_image
    from curated_links
    where source_image is not null
      and source_image <> ''
      and source_image not like '/images/%'
      and source_image not like '%pub-a22f31a467534add843b6cf22cf4f443.r2.dev%'
    order by date desc
    ${limit ? `limit ${Number(limit)}` : ""}
  `,
  )) as CuratedRow[];

  let rehosted = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    if (isManagedImage(row.source_image)) {
      skipped++;
      continue;
    }
    try {
      const result = await rehostAvatar({
        postUrl: row.url,
        sourceImage: row.source_image,
        client,
      });
      const newUrl = result.url;
      if (newUrl === row.source_image) {
        skipped++;
        continue;
      }
      if (dryRun) {
        console.log(`[dry] curated ${row.id} (${row.source}) → ${result.key} (${result.skipped ? "skip:" + result.reason : "upload"})`);
      } else {
        await sql.unsafe(`update curated_links set source_image = $1, updated_at = now() where id = $2`, [newUrl, row.id]);
        console.log(`curated ${row.id} (${row.source}) → ${newUrl} (${result.skipped ? "skip:" + result.reason : "upload"})`);
      }
      rehosted++;
    } catch (err) {
      failed++;
      console.error(`FAIL curated ${row.id}: ${(err as Error).message}`);
    }
  }
  return { scanned: rows.length, rehosted, skipped, failed };
}

async function backfillAnnouncements(
  sql: postgres.Sql,
  client: S3Client,
  dryRun: boolean,
  limit?: number,
): Promise<{ scanned: number; rehosted: number; skipped: number; failed: number }> {
  const rows = (await sql.unsafe<AnnouncementRow[]>(
    `
    select id, url, company, company_logo
    from announcements
    where company_logo is not null
      and company_logo <> ''
      and company_logo not like '/images/%'
      and company_logo not like '%pub-a22f31a467534add843b6cf22cf4f443.r2.dev%'
    order by date desc
    ${limit ? `limit ${Number(limit)}` : ""}
  `,
  )) as AnnouncementRow[];

  let rehosted = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    if (isManagedImage(row.company_logo)) {
      skipped++;
      continue;
    }
    try {
      const result = await rehostCompanyLogo({
        company: row.company,
        sourceLogo: row.company_logo,
        client,
      });
      if (dryRun) {
        console.log(`[dry] announcement ${row.id} (${row.company}) → ${result.key} (${result.skipped ? "skip:" + result.reason : "upload"})`);
      } else {
        await sql.unsafe(`update announcements set company_logo = $1, updated_at = now() where id = $2`, [result.url, row.id]);
        console.log(`announcement ${row.id} (${row.company}) → ${result.url} (${result.skipped ? "skip:" + result.reason : "upload"})`);
      }
      rehosted++;
    } catch (err) {
      failed++;
      console.error(`FAIL announcement ${row.id}: ${(err as Error).message}`);
    }
  }
  return { scanned: rows.length, rehosted, skipped, failed };
}

async function main() {
  const { env, dryRun, limit } = parseArgs();
  const dbUrl = dbUrlFor(env);
  const sql = postgres(dbUrl, { max: 1, socket: () => createPreferredPostgresSocket(dbUrl) });
  const client = r2Client();

  console.log(`Backfilling news images on ${env}${dryRun ? " (dry-run)" : ""}${limit ? ` limit=${limit}` : ""}`);

  try {
    const curated = await backfillCurated(sql, client, dryRun, limit);
    const ann = await backfillAnnouncements(sql, client, dryRun, limit);

    console.log("\n=== summary ===");
    console.log("curated_links:  ", curated);
    console.log("announcements:  ", ann);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

await main();
