/**
 * Jobs board audit:
 *   1. liveness-check every row in `jobs` (concurrent GET, short timeout)
 *   2. for each Ashby org represented in the board, hit the public posting API and
 *      diff "live on ATS" vs "in DB" to surface new openings + canonical-dead links
 *   3. for non-Ashby companies, fetch the landing page (host root of the job link
 *      or companyWebsite) and report the link list for manual eyeballing
 *
 * Modes:
 *   --report   (default) print findings, no writes
 *   --execute  delete clearly-dead jobs (status === "dead") from BOTH databases
 *
 * Secrets come from 1Password via `op`:
 *   DATABASE_URL          → op://Agents/dcbuilder.dev - DATABASE_URL/credential          (prod)
 *   DATABASE_URL_STAGING  → op://Agents/dcbuilder.dev - DATABASE_URL_STAGING/credential  (local/runtime)
 *
 * Invoke with both already exported, e.g. from a wrapper:
 *   DATABASE_URL=$(op read ...) DATABASE_URL_STAGING=$(op read ...) bun run scripts/audit-jobs.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, inArray } from "drizzle-orm";
import { jobs } from "../src/db/schema/jobs";
import { createPreferredPostgresSocket } from "../src/db/postgres-connection";

type Status = "live" | "dead" | "ambiguous" | "error";

interface JobRow {
  id: string;
  title: string;
  company: string;
  link: string;
  companyWebsite: string | null;
}

interface LivenessResult {
  job: JobRow;
  status: Status;
  httpStatus: number | null;
  reason: string;
}

const REQUEST_TIMEOUT_MS = 12_000;
const CONCURRENCY = 12;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) dcbuilder-dev/jobs-audit (+https://dcbuilder.dev)";

const DEAD_BODY_MARKERS = [
  "job is no longer",
  "no longer accepting applications",
  "this position has been filled",
  "this role has been filled",
  "position is no longer available",
  "posting has been closed",
  "this job has expired",
  "page not found",
];

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": USER_AGENT, ...(init.headers ?? {}) },
    });
  } finally {
    clearTimeout(t);
  }
}

async function checkOne(job: JobRow): Promise<LivenessResult> {
  try {
    const res = await fetchWithTimeout(job.link);
    const http = res.status;

    // Hard dead: 404 / 410
    if (http === 404 || http === 410) {
      return { job, status: "dead", httpStatus: http, reason: `HTTP ${http}` };
    }

    // Auth gates / rate limits → can't classify
    if (http === 401 || http === 403 || http === 429) {
      return { job, status: "ambiguous", httpStatus: http, reason: `HTTP ${http}` };
    }

    if (http >= 500) {
      return { job, status: "error", httpStatus: http, reason: `HTTP ${http}` };
    }

    if (http >= 200 && http < 300) {
      // Body sniff for "closed" markers on otherwise-200 pages
      const body = (await res.text()).toLowerCase();
      for (const m of DEAD_BODY_MARKERS) {
        if (body.includes(m)) {
          return { job, status: "ambiguous", httpStatus: http, reason: `body: "${m}"` };
        }
      }

      // Redirect detection: if the final URL no longer references the job-specific path,
      // the ATS probably bounced us to the board root (job was removed).
      try {
        const finalUrl = new URL(res.url);
        const originalUrl = new URL(job.link);
        const sameHost = finalUrl.hostname === originalUrl.hostname;
        // Ashby UUID-style suffix check
        const uuidRe = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
        const origIds = originalUrl.pathname.match(uuidRe);
        if (origIds && !finalUrl.pathname.includes(origIds[0]) && sameHost) {
          return {
            job,
            status: "dead",
            httpStatus: http,
            reason: `redirected away from job id (${finalUrl.pathname})`,
          };
        }
      } catch {
        // ignore url parsing errors
      }

      return { job, status: "live", httpStatus: http, reason: "ok" };
    }

    return { job, status: "ambiguous", httpStatus: http, reason: `HTTP ${http}` };
  } catch (err) {
    return {
      job,
      status: "error",
      httpStatus: null,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

async function poolMap<T, U>(items: T[], n: number, fn: (t: T) => Promise<U>): Promise<U[]> {
  const out: U[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

function extractAshbyOrg(link: string): string | null {
  try {
    const u = new URL(link);
    if (u.hostname !== "jobs.ashbyhq.com") return null;
    const seg = u.pathname.split("/").filter(Boolean);
    return seg[0] ? decodeURIComponent(seg[0]) : null;
  } catch {
    return null;
  }
}

function normalizeAshbyLink(link: string): string {
  try {
    const u = new URL(link);
    return `${u.origin}${decodeURI(u.pathname)}`;
  } catch {
    return link.split("?")[0];
  }
}

interface AshbyPosting {
  id: string;
  title: string;
  jobUrl: string;
  isListed?: boolean;
}

async function fetchAshbyOrg(org: string): Promise<AshbyPosting[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(org)}?includeCompensation=false`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const json = (await res.json()) as { jobs?: AshbyPosting[] };
    return (json.jobs ?? []).filter((j) => j.isListed !== false);
  } catch {
    return [];
  }
}

async function fetchLandingLinks(url: string): Promise<string[]> {
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const html = await res.text();
    const hrefs = Array.from(html.matchAll(/href=["']([^"']+)["']/gi)).map((m) => m[1]);
    return Array.from(new Set(hrefs));
  } catch {
    return [];
  }
}

async function connect(label: string, url: string) {
  const sql = postgres(url, { max: 1, socket: () => createPreferredPostgresSocket(url) });
  const db = drizzle(sql, { schema: { jobs } });
  return { label, sql, db };
}

function fmt(r: LivenessResult): string {
  return `  [${r.status.toUpperCase()}] ${r.job.company} — ${r.job.title}\n    ${r.job.link}\n    → ${r.reason}`;
}

async function main() {
  const execute = process.argv.includes("--execute");

  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
  if (!process.env.DATABASE_URL_STAGING) throw new Error("DATABASE_URL_STAGING not set");

  const prod = await connect("PROD", process.env.DATABASE_URL!);
  const staging = await connect("STAGING", process.env.DATABASE_URL_STAGING!);

  try {
    const rows = (await prod.db
      .select({
        id: jobs.id,
        title: jobs.title,
        company: jobs.company,
        link: jobs.link,
        companyWebsite: jobs.companyWebsite,
      })
      .from(jobs)) as JobRow[];

    console.log(`Auditing ${rows.length} jobs across ${new Set(rows.map((r) => r.company)).size} companies`);
    console.log(`Mode: ${execute ? "EXECUTE (will delete dead)" : "REPORT (no writes)"}`);
    console.log("");

    // ---- Step 1: per-job liveness ----
    console.log(`▶ Step 1/3  liveness-check ${rows.length} URLs (concurrency=${CONCURRENCY})`);
    const t0 = Date.now();
    const results = await poolMap(rows, CONCURRENCY, checkOne);
    console.log(`  done in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

    const dead = results.filter((r) => r.status === "dead");
    const ambiguous = results.filter((r) => r.status === "ambiguous");
    const errored = results.filter((r) => r.status === "error");
    const live = results.filter((r) => r.status === "live");

    console.log(
      `  live: ${live.length}   dead: ${dead.length}   ambiguous: ${ambiguous.length}   errored: ${errored.length}`,
    );

    if (dead.length) {
      console.log(`\n── DEAD (will be deleted in --execute mode) ──`);
      for (const r of dead) console.log(fmt(r));
    }
    if (ambiguous.length) {
      console.log(`\n── AMBIGUOUS (manual review) ──`);
      for (const r of ambiguous) console.log(fmt(r));
    }
    if (errored.length) {
      console.log(`\n── ERRORED (network/timeout — manual review) ──`);
      for (const r of errored) console.log(fmt(r));
    }

    // ---- Step 2: Ashby diff ----
    const ashbyOrgs = new Set<string>();
    for (const r of rows) {
      const org = extractAshbyOrg(r.link);
      if (org) ashbyOrgs.add(org);
    }
    console.log(`\n▶ Step 2/3  Ashby diff — ${ashbyOrgs.size} orgs`);
    const dbLinkSet = new Set(rows.map((r) => normalizeAshbyLink(r.link)));
    const newAshby: { org: string; posting: AshbyPosting }[] = [];
    const ashbyLiveLinks = new Set<string>();
    for (const org of ashbyOrgs) {
      const postings = await fetchAshbyOrg(org);
      console.log(`  ${org}: ${postings.length} live postings`);
      for (const p of postings) {
        const norm = normalizeAshbyLink(p.jobUrl);
        ashbyLiveLinks.add(norm);
        if (!dbLinkSet.has(norm)) newAshby.push({ org, posting: p });
      }
    }
    if (newAshby.length) {
      console.log(`\n── NEW on Ashby (not in DB) ──`);
      for (const { org, posting } of newAshby) {
        console.log(`  [${org}] ${posting.title}\n    ${posting.jobUrl}`);
      }
    } else {
      console.log(`  no new Ashby postings found`);
    }

    // Cross-check: any Ashby DB job whose link is NOT in the Ashby live set is also dead-by-canonical-source
    const ashbyDbJobs = rows.filter((r) => extractAshbyOrg(r.link));
    const canonicalDeadAshby = ashbyDbJobs.filter(
      (r) => !ashbyLiveLinks.has(normalizeAshbyLink(r.link)),
    );
    if (canonicalDeadAshby.length) {
      console.log(`\n── CANONICAL-DEAD on Ashby (not returned by job-board API) ──`);
      for (const r of canonicalDeadAshby) {
        console.log(`  ${r.company} — ${r.title}\n    ${r.link}`);
      }
    }

    // ---- Step 3: non-Ashby landing pages (informational) ----
    const nonAshbyCompanies = new Map<string, JobRow[]>();
    for (const r of rows) {
      if (!extractAshbyOrg(r.link)) {
        const list = nonAshbyCompanies.get(r.company) ?? [];
        list.push(r);
        nonAshbyCompanies.set(r.company, list);
      }
    }
    console.log(`\n▶ Step 3/3  non-Ashby landing pages — ${nonAshbyCompanies.size} companies`);
    for (const [company, list] of nonAshbyCompanies) {
      const sample = list[0];
      const candidate = (() => {
        try {
          const u = new URL(sample.link);
          // Most career sub-hosts ARE the landing page
          return `${u.protocol}//${u.hostname}${u.pathname.split("/").slice(0, 2).join("/")}`;
        } catch {
          return sample.companyWebsite ?? sample.link;
        }
      })();
      const links = await fetchLandingLinks(candidate);
      // Keep only links that look like job listings (share a path token with at least one current job)
      const jobPaths = list.map((j) => new URL(j.link).pathname);
      const interesting = links.filter((href) => {
        if (!/^https?:\/\//i.test(href) && !href.startsWith("/")) return false;
        const lower = href.toLowerCase();
        return (
          lower.includes("job") ||
          lower.includes("career") ||
          lower.includes("apply") ||
          lower.includes("hiring") ||
          jobPaths.some((p) => href.includes(p.split("/")[1] ?? ""))
        );
      });
      console.log(
        `  ${company} (${list.length} in DB) → ${candidate}\n    ${interesting.length} candidate links on page`,
      );
    }

    // ---- Step 4: deletes ----
    const allDeadIds = Array.from(
      new Set([
        ...dead.map((d) => d.job.id),
        ...canonicalDeadAshby.map((j) => j.id),
      ]),
    );

    if (!execute) {
      console.log(`\n${allDeadIds.length} jobs would be deleted in --execute mode.`);
      console.log(`Ambiguous (${ambiguous.length}) and errored (${errored.length}) are left alone.`);
      return;
    }

    if (!allDeadIds.length) {
      console.log(`\nNo dead jobs to delete.`);
      return;
    }

    console.log(`\nDeleting ${allDeadIds.length} dead jobs from PROD + STAGING…`);
    const prodDel = await prod.db.delete(jobs).where(inArray(jobs.id, allDeadIds)).returning({ id: jobs.id });
    const stagingDel = await staging.db
      .delete(jobs)
      .where(inArray(jobs.id, allDeadIds))
      .returning({ id: jobs.id });
    console.log(`  PROD deleted: ${prodDel.length}`);
    console.log(`  STAGING deleted: ${stagingDel.length}`);
  } finally {
    await prod.sql.end({ timeout: 5 });
    await staging.sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
