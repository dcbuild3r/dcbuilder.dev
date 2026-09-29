/**
 * Jobs board sync:
 *   1. liveness-check every current job URL
 *   2. reconcile authoritative ATS / careers-board listings with the DB
 *   3. in --execute mode delete confirmed-dead jobs and add newly listed jobs
 *      to BOTH production and staging
 *
 * Run on Runner Desktop with DATABASE_URL (production) and
 * DATABASE_URL_STAGING already set. Do not print database URLs.
 */

import { load } from "cheerio";
import { createId } from "@paralleldrive/cuid2";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import postgres from "postgres";
import { jobTags, jobs } from "../src/db/schema/jobs";
import { createPreferredPostgresSocket } from "../src/db/postgres-connection";

type Status = "live" | "dead" | "ambiguous" | "error";
type BoardKind = "html" | "bamboo" | "next" | "ashby" | "zenith" | "notion";

interface JobRow {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  link: string;
  location: string | null;
  remote: string | null;
  type: string | null;
  department: string | null;
  tags: string[] | null;
  category: string;
  companyWebsite: string | null;
  companyX: string | null;
  companyGithub: string | null;
}

interface LivenessResult {
  job: JobRow;
  status: Status;
  httpStatus: number | null;
  reason: string;
}

interface AshbyPosting {
  id: string;
  title: string;
  jobUrl: string;
  locationName?: string;
  employmentType?: string;
  department?: string;
  isRemote?: boolean;
  isListed?: boolean;
  descriptionHtml?: string;
  descriptionPlain?: string;
  compensationTierSummary?: string | null;
  scrapeableCompensationSalarySummary?: string | null;
}

interface DiscoveredJob {
  company: string;
  title: string;
  link: string;
  location?: string | null;
  remote?: string | null;
  type?: string | null;
  department?: string | null;
  description?: string | null;
  responsibilities?: string[] | null;
  qualifications?: string[] | null;
  benefits?: string[] | null;
  salary?: string | null;
}

interface BoardConfig {
  company: string;
  url: string;
  kind?: BoardKind;
  /** Skip board reconciliation entirely (liveness-only; never adds, never deletes). */
  skip?: boolean;
  /** Specific paths/params that identify a job record on an otherwise broad page. */
  pathHints?: string[];
  /** Opt in only for static boards whose complete job list is server-rendered. */
  canonicalHtml?: boolean;
}

interface SourceResult {
  company: string;
  source: string;
  jobs: DiscoveredJob[];
  /** A failed or heuristic-only parse must never drive deletions. */
  canonical: boolean;
  error?: string;
}

const REQUEST_TIMEOUT_MS = 12_000;
const CONCURRENCY = 12;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) dcbuilder-dev/jobs-sync (+https://dcbuilder.dev)";

const DEAD_BODY_MARKERS = [
  "job is no longer",
  "no longer accepting applications",
  "this position has been filled",
  "this role has been filled",
  "position is no longer available",
  "posting has been closed",
  "this job has expired",
];

/** Boards that cannot be derived safely from an individual job URL. */
const BOARD_OVERRIDES: Record<string, Omit<BoardConfig, "company">> = {
  Accountable: { url: "https://form.typeform.com/to/veqiif6b" },
  Agora: { url: "https://www.agora.xyz/jobs", kind: "next", pathHints: ["/posts/"] },
  Bagel: { url: "https://www.bagel.com/careers", pathHints: ["/careers/"], canonicalHtml: true },
  Berachain: { url: "https://careers.berachain.com/", pathHints: ["/jobs/", "/299", "/351", "/360"] },
  "Blockchain Capital": {
    url: "https://jobs.blockchaincapital.com/companies/blockchain-capital-2",
    pathHints: ["/companies/blockchain-capital-2/jobs/"],
  },
  CoinFund: {
    url: "https://jobs.coinfund.io/companies/coinfund",
    pathHints: ["/companies/coinfund/jobs/"],
  },
  Commonware: { url: "https://commonware.xyz/hiring", pathHints: ["ashby_jid="] },
  "Ethereum Institutional": {
    url: "https://www.ethereuminstitutional.org/careers/",
    pathHints: ["/careers/"],
    canonicalHtml: true,
  },
  Inco: { url: "https://inco.bamboohr.com/careers/list", kind: "bamboo" },
  Lucis: { url: "https://api.ashbyhq.com/posting-api/job-board/lucis?includeCompensation=false", kind: "ashby" },
  MegaETH: { url: "https://www.megaeth.com/about#career", pathHints: ["career", "jobs"] },
  Morpho: { url: "https://api.ashbyhq.com/posting-api/job-board/Morpho?includeCompensation=false", kind: "ashby" },
  "Ooga Booga": {
    url: "https://ecojobs.berachain.com/jobs/ooga-booga",
    pathHints: ["/jobs/ooga-booga/"],
    skip: true,
  },
  OWN: { url: "https://own.casa/careers", pathHints: ["/careers/"] },
  Puma: { url: "https://puma.tech/pages", pathHints: ["/pages/"] },
  Rhinestone: {
    url: "https://rhinestone.notion.site/Rhinestone-Job-Board-faf25f85b9244f8c81fa63387c4f910a",
    pathHints: ["p="],
  },
  RockawayX: { url: "https://rockawayx.com/careers", pathHints: ["/careers/"] },
  Sorella: { url: "https://sorellalabs.xyz/careers", pathHints: ["gh_jid="] },
  Zellic: {
    url: "https://zellic-inc.notion.site/Jobs-at-Zellic-82cab8ab2be84a3b9fa443e56196fdfa",
    kind: "notion",
  },
  Zenith: { url: "https://platform.zenith.network/api/public/jobs", kind: "zenith" },
};

/** Stable company-context tags. Role-specific tags are inferred from the title. */
const COMPANY_TAGS: Record<string, string[]> = {
  Berachain: ["berachain-ecosystem", "web3"],
  "Category Labs": ["monad-ecosystem", "web3"],
  Dune: ["data", "web3"],
  Lucis: ["health", "ai"],
  "Merge Labs": ["health", "bci"],
  Monad: ["monad-ecosystem", "web3"],
  "Monad Foundation": ["monad-ecosystem", "web3"],
  Morpho: ["defi", "web3"],
  Nethermind: ["web3", "infra"],
  "Ooga Booga": ["berachain-ecosystem", "defi", "web3"],
  "Prime Intellect": ["ai", "ml"],
  Succinct: ["zkp", "cryptography", "web3"],
  Tempo: ["web3"],
  "Uniswap Labs": ["defi", "web3"],
  World: ["world"],
};

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": USER_AGENT, ...(init.headers ?? {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

function squash(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function absoluteUrl(href: string, base: string): string | null {
  try {
    const url = new URL(href, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Removes analytics noise while preserving query parameters that identify a job.
 * This permits, for example, `?gh_jid=<id>` to match an existing `?gh_jid=<id>&view=jd`.
 */
function normalizeJobLink(link: string): string {
  try {
    const url = new URL(link);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    const uuid = url.pathname.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
    // Some companies (for example Morpho) wrap Ashby IDs in a first-party URL.
    // The UUID is globally stable and prevents a wrapper/direct-Ashby duplicate.
    if (uuid) return `job:${uuid.toLowerCase()}`;
    if (url.hostname === "jobs.ashbyhq.com") {
      return `${url.origin}${decodeURIComponent(url.pathname)}`;
    }
    const identityParams = ["gh_jid", "ashby_jid", "job_id", "opening_id", "position_id"];
    const preserved = identityParams
      .flatMap((key) => url.searchParams.getAll(key).map((value) => [key, value] as const))
      .sort(([a], [b]) => a.localeCompare(b));
    const query = preserved.length
      ? `?${preserved.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")}`
      : "";
    return `${url.origin}${decodeURIComponent(url.pathname).replace(/\/$/, "")}${query}`;
  } catch {
    return link.split("#")[0];
  }
}

function extractAshbyOrg(link: string): string | null {
  try {
    const url = new URL(link);
    if (url.hostname !== "jobs.ashbyhq.com") return null;
    const segment = url.pathname.split("/").filter(Boolean)[0];
    return segment ? decodeURIComponent(segment) : null;
  } catch {
    return null;
  }
}

function getBoardConfig(company: string, sample: JobRow): BoardConfig | null {
  const override = BOARD_OVERRIDES[company];
  if (override) return { company, ...override };
  try {
    const url = new URL(sample.link);
    if (/notion\.site$|notion\.so$|form\.typeform\.com$|tally\.so$|apply\.canvider\.com$/.test(url.hostname)) {
      return null;
    }
    const segments = url.pathname.split("/").filter(Boolean);
    if (!segments.length) return null;
    const root = segments[0];
    if (["jobs", "job", "careers", "career", "apply", "positions", "pages"].includes(root)) {
      return { company, url: `${url.origin}/${root}`, pathHints: [`/${root}/`] };
    }
  } catch {
    // Unsupported malformed URL: report via liveness, not board reconciliation.
  }
  return null;
}

async function checkOne(job: JobRow): Promise<LivenessResult> {
  try {
    const res = await fetchWithTimeout(job.link);
    const httpStatus = res.status;
    if (httpStatus === 404 || httpStatus === 410) {
      return { job, status: "dead", httpStatus, reason: `HTTP ${httpStatus}` };
    }
    if (httpStatus === 401 || httpStatus === 403 || httpStatus === 429) {
      return { job, status: "ambiguous", httpStatus, reason: `HTTP ${httpStatus}` };
    }
    if (httpStatus >= 500) {
      return { job, status: "error", httpStatus, reason: `HTTP ${httpStatus}` };
    }
    if (httpStatus >= 200 && httpStatus < 300) {
      const body = (await res.text()).toLowerCase();
      for (const marker of DEAD_BODY_MARKERS) {
        if (body.includes(marker)) {
          return { job, status: "ambiguous", httpStatus, reason: `body: "${marker}"` };
        }
      }
      try {
        const finalUrl = new URL(res.url);
        const originalUrl = new URL(job.link);
        const uuid = originalUrl.pathname.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
        if (uuid && finalUrl.hostname === originalUrl.hostname && !finalUrl.pathname.includes(uuid)) {
          return {
            job,
            status: "dead",
            httpStatus,
            reason: `redirected away from job id (${finalUrl.pathname})`,
          };
        }
      } catch {
        // A malformed redirect must not turn into a deletion signal.
      }
      return { job, status: "live", httpStatus, reason: "ok" };
    }
    return { job, status: "ambiguous", httpStatus, reason: `HTTP ${httpStatus}` };
  } catch (error) {
    return {
      job,
      status: "error",
      httpStatus: null,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function poolMap<T, U>(items: T[], concurrency: number, fn: (item: T) => Promise<U>): Promise<U[]> {
  const output: U[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      output[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return output;
}

async function fetchAshbyOrg(org: string): Promise<{ postings: AshbyPosting[]; error?: string }> {
  const endpoint = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(org)}?includeCompensation=false`;
  try {
    const response = await fetchWithTimeout(endpoint);
    if (!response.ok) return { postings: [], error: `HTTP ${response.status}` };
    const json = (await response.json()) as { jobs?: AshbyPosting[] };
    return { postings: (json.jobs ?? []).filter((posting) => posting.isListed !== false) };
  } catch (error) {
    return { postings: [], error: error instanceof Error ? error.message : String(error) };
  }
}

function cleanTitle(value: string): string | null {
  const title = squash(value)
    .replace(/^(view role|view job|view position|apply now)\s*[:\-]?\s*/i, "")
    .replace(/[→›»]+$/g, "")
    .trim();
  if (title.length < 3 || title.length > 180) return null;
  if (/^(careers?|jobs?|search jobs?|open positions?|view role|learn more|apply|read more|contact)$/i.test(title)) return null;
  return title;
}

function htmlAnchorTitle($: ReturnType<typeof load>, element: Parameters<ReturnType<typeof load>>[0]): string | null {
  const anchor = $(element);
  const heading = squash(anchor.find("h1,h2,h3,h4,h5,[data-job-title]").first().text());
  const aria = squash(anchor.attr("aria-label"));
  const raw = heading || aria || squash(anchor.text());
  return cleanTitle(raw);
}

function looksLikeJobUrl(url: URL, source: URL, hints: string[]): boolean {
  const whole = `${url.pathname}${url.search}`.toLowerCase();
  if (url.href === source.href || url.pathname === source.pathname && !url.search) return false;
  if (hints.some((hint) => whole.includes(hint.toLowerCase()))) return true;
  return /\/(jobs?|careers?|positions?|apply)\/?/.test(url.pathname) || /(?:gh_jid|ashby_jid|job_id|opening_id)=/i.test(url.search);
}

function dedupeDiscovered(jobsToDedupe: DiscoveredJob[]): DiscoveredJob[] {
  const unique = new Map<string, DiscoveredJob>();
  for (const job of jobsToDedupe) {
    const key = normalizeJobLink(job.link);
    if (!unique.has(key)) unique.set(key, job);
  }
  return [...unique.values()];
}

async function fetchHtmlBoard(config: BoardConfig): Promise<SourceResult> {
  try {
    const response = await fetchWithTimeout(config.url);
    if (!response.ok) {
      return { company: config.company, source: config.url, jobs: [], canonical: false, error: `HTTP ${response.status}` };
    }
    const html = await response.text();
    const $ = load(html);
    const sourceUrl = new URL(response.url);
    const found: DiscoveredJob[] = [];

    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const resolved = absoluteUrl(href, response.url);
      if (!resolved) return;
      const jobUrl = new URL(resolved);
      if (!looksLikeJobUrl(jobUrl, sourceUrl, config.pathHints ?? [])) return;
      const title = htmlAnchorTitle($, element);
      if (!title) return;
      const parentText = squash($(element).text());
      const location = /\b(remote|hybrid|on[- ]site|san francisco|new york|london|paris|berlin|india|tokyo|hong kong|bay area)\b/i.test(parentText)
        ? parentText.replace(title, "").trim().slice(0, 140) || null
        : null;
      found.push({ company: config.company, title, link: resolved, location, remote: /\bremote\b/i.test(parentText) ? "Remote" : null });
    });

    const jobsFound = dedupeDiscovered(found);
    // HTML pages are add-only by default. Only carefully vetted, static boards opt in
    // to canonical reconciliation after yielding concrete role records.
    return {
      company: config.company,
      source: response.url,
      jobs: jobsFound,
      canonical: Boolean(config.canonicalHtml && jobsFound.length),
    };
  } catch (error) {
    return {
      company: config.company,
      source: config.url,
      jobs: [],
      canonical: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fetchBambooBoard(config: BoardConfig): Promise<SourceResult> {
  try {
    const response = await fetchWithTimeout(config.url);
    if (!response.ok) {
      return { company: config.company, source: config.url, jobs: [], canonical: false, error: `HTTP ${response.status}` };
    }
    const json = (await response.json()) as {
      result?: Array<{
        id?: string;
        jobOpeningName?: string;
        departmentLabel?: string;
        employmentStatusLabel?: string;
        atsLocation?: { country?: string | null; state?: string | null; province?: string | null; city?: string | null };
        location?: { city?: string | null; state?: string | null };
        isRemote?: boolean | null;
      }>;
    };
    const base = new URL(config.url);
    const jobsFound = (json.result ?? []).flatMap((role): DiscoveredJob[] => {
      const title = cleanTitle(role.jobOpeningName ?? "");
      if (!title || !role.id) return [];
      const location = [
        role.location?.city,
        role.location?.state,
        role.atsLocation?.city,
        role.atsLocation?.state,
        role.atsLocation?.province,
        role.atsLocation?.country,
      ].filter(Boolean).filter((item, index, all) => all.indexOf(item) === index).join(", ") || null;
      return [{
        company: config.company,
        title,
        link: `${base.origin}/careers/${role.id}`,
        location,
        remote: role.isRemote ? "Remote" : null,
        type: role.employmentStatusLabel ?? null,
        department: role.departmentLabel ?? null,
      }];
    });
    // BambooHR's JSON response is authoritative, including a valid empty result set.
    return { company: config.company, source: config.url, jobs: dedupeDiscovered(jobsFound), canonical: true };
  } catch (error) {
    return {
      company: config.company,
      source: config.url,
      jobs: [],
      canonical: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fetchNextBoard(config: BoardConfig): Promise<SourceResult> {
  try {
    const response = await fetchWithTimeout(config.url);
    if (!response.ok) {
      return { company: config.company, source: config.url, jobs: [], canonical: false, error: `HTTP ${response.status}` };
    }
    const html = await response.text();
    const $ = load(html);
    const payload = $("#__NEXT_DATA__").text();
    if (!payload) return { company: config.company, source: response.url, jobs: [], canonical: false, error: "missing __NEXT_DATA__" };
    const json = JSON.parse(payload) as { props?: { pageProps?: { jobs?: Array<{ slug?: string; title?: string; location?: string }> } } };
    const roles = json.props?.pageProps?.jobs;
    if (!Array.isArray(roles)) return { company: config.company, source: response.url, jobs: [], canonical: false, error: "missing pageProps.jobs" };
    const jobsFound = roles.flatMap((role): DiscoveredJob[] => {
      const title = cleanTitle(role.title ?? "");
      if (!title || !role.slug) return [];
      return [{
        company: config.company,
        title,
        link: absoluteUrl(`/posts/${role.slug}`, response.url)!,
        location: role.location ?? null,
        remote: /\bremote\b/i.test(role.location ?? "") ? "Remote" : null,
      }];
    });
    // The structured Next payload is authoritative, including a valid empty jobs array.
    return { company: config.company, source: response.url, jobs: dedupeDiscovered(jobsFound), canonical: true };
  } catch (error) {
    return {
      company: config.company,
      source: config.url,
      jobs: [],
      canonical: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fetchConfiguredAshbyBoard(config: BoardConfig): Promise<SourceResult> {
  try {
    const response = await fetchWithTimeout(config.url);
    if (!response.ok) return { company: config.company, source: config.url, jobs: [], canonical: false, error: `HTTP ${response.status}` };
    const json = (await response.json()) as { jobs?: AshbyPosting[] };
    const jobsFound = (json.jobs ?? []).filter((posting) => posting.isListed !== false).map((posting): DiscoveredJob => {
      const details = detailsFromAshby(posting);
      return {
        company: config.company,
        title: posting.title,
        link: posting.jobUrl,
        location: posting.locationName ?? null,
        remote: posting.isRemote ? "Remote" : /\bremote\b/i.test(posting.locationName ?? "") ? "Remote" : null,
        type: posting.employmentType ?? null,
        department: posting.department ?? null,
        description: details.description,
        responsibilities: details.responsibilities.length ? details.responsibilities : null,
        qualifications: details.qualifications.length ? details.qualifications : null,
        benefits: details.benefits.length ? details.benefits : null,
        salary: details.salary,
      };
    });
    return { company: config.company, source: config.url, jobs: dedupeDiscovered(jobsFound), canonical: true };
  } catch (error) {
    return { company: config.company, source: config.url, jobs: [], canonical: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function fetchZenithBoard(config: BoardConfig): Promise<SourceResult> {
  try {
    const response = await fetchWithTimeout(config.url);
    if (!response.ok) {
      return { company: config.company, source: config.url, jobs: [], canonical: false, error: `HTTP ${response.status}` };
    }
    const json = (await response.json()) as Array<{
      slug?: string;
      title?: string;
      location?: string;
      jobType?: string;
      description?: string;
    }>;
    if (!Array.isArray(json)) {
      return { company: config.company, source: response.url, jobs: [], canonical: false, error: "unexpected payload" };
    }
    const jobsFound = json.flatMap((role): DiscoveredJob[] => {
      const title = cleanTitle(role.title ?? "");
      if (!title || !role.slug) return [];
      const split = role.description ? splitPostingSections(htmlToMarkdownish(role.description)) : null;
      return [{
        company: config.company,
        title,
        link: `https://platform.zenith.network/apply/${encodeURIComponent(role.slug)}`,
        location: role.location ?? null,
        remote: /\bremote\b/i.test(role.location ?? "") ? "Remote" : null,
        type: role.jobType ?? null,
        description: split?.description ?? null,
        responsibilities: split && split.responsibilities.length ? split.responsibilities : null,
        qualifications: split && split.qualifications.length ? split.qualifications : null,
        benefits: split && split.benefits.length ? split.benefits : null,
      }];
    });
    // The public jobs JSON backing zenith.network/careers is authoritative,
    // including a valid empty result set.
    return { company: config.company, source: response.url, jobs: dedupeDiscovered(jobsFound), canonical: true };
  } catch (error) {
    return {
      company: config.company,
      source: config.url,
      jobs: [],
      canonical: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Public Notion board backed by a database (collection view).
 * Notion renders client-side, so plain HTML yields nothing. The app's own
 * anonymous endpoints — loadCachedPageChunkV2 + queryCollection — work with
 * no auth and return the collection rows, so they are authoritative.
 */
async function fetchNotionBoard(config: BoardConfig): Promise<SourceResult> {
  try {
    const boardUrl = new URL(config.url);
    const hex = boardUrl.pathname.match(/([0-9a-f]{32})$/i)?.[1];
    if (!hex) {
      return { company: config.company, source: config.url, jobs: [], canonical: false, error: "no page id in URL" };
    }
    const pageId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    const endpoint = `${boardUrl.origin}/api/v3`;
    const jsonHeaders = {
      "content-type": "application/json",
      accept: "application/json",
      "x-notion-active-user-header": "",
    };
    const chunkResponse = await fetchWithTimeout(`${endpoint}/loadCachedPageChunkV2`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        pageId,
        limit: 100,
        cursor: { stack: [] },
        chunkNumber: 0,
        verticalColumns: false,
      }),
    });
    if (!chunkResponse.ok) {
      return { company: config.company, source: config.url, jobs: [], canonical: false, error: `chunk HTTP ${chunkResponse.status}` };
    }
    const chunk = (await chunkResponse.json()) as {
      recordMap?: { block?: Record<string, { spaceId?: string; value?: { value?: { type?: string; collection_id?: string; view_ids?: string[] } } }> };
    };
    const blocks = chunk.recordMap?.block ?? {};
    let collectionId: string | null = null;
    let spaceId: string | null = null;
    let collectionViewBlockId: string | null = null;
    for (const [blockId, record] of Object.entries(blocks)) {
      const value = record.value?.value;
      if (value?.type === "collection_view") {
        collectionId = value.collection_id ?? null;
        collectionViewBlockId = blockId;
        spaceId = record.spaceId ?? null;
        break;
      }
    }
    if (!collectionId || !collectionViewBlockId || !spaceId) {
      return { company: config.company, source: config.url, jobs: [], canonical: false, error: "no collection view in chunk" };
    }
    const viewId = await (async () => {
      // Prefer the first view id from the chunk; fall back to the collection block itself.
      const block = blocks[collectionViewBlockId];
      const viewIds = block?.value?.value?.view_ids;
      return viewIds?.[0] ?? collectionViewBlockId;
    })();

    const queryResponse = await fetchWithTimeout(`${endpoint}/queryCollection`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        source: { type: "collection", id: collectionId, spaceId },
        pageId,
        collectionView: { id: viewId, spaceId },
        collectionViewBlock: { id: collectionViewBlockId, spaceId },
        clientType: "notion_app",
        userTimeZone: "UTC",
        isFullScreen: true,
        isMobile: false,
        loader: { reducer: { type: "results", limit: 100 }, searchQuery: "" },
        query: { aggregations: [], filter: {}, sort: [] },
      }),
    });
    if (!queryResponse.ok) {
      return { company: config.company, source: config.url, jobs: [], canonical: false, error: `query HTTP ${queryResponse.status}` };
    }
    const query = (await queryResponse.json()) as {
      recordMap?: { block?: Record<string, { value?: { value?: { type?: string; properties?: Record<string, unknown> } } }> };
      result?: { reducerResults?: { list_groups?: { blockResults?: Record<string, { blockIds?: string[] }> } } };
    };
    const rowIds = new Set<string>();
    for (const group of Object.values(query.result?.reducerResults?.list_groups?.blockResults ?? {})) {
      for (const id of group?.blockIds ?? []) rowIds.add(id);
    }
    const jobsFound: DiscoveredJob[] = [];
    for (const blockId of rowIds) {
      const value = query.recordMap?.block?.[blockId]?.value?.value;
      if (!value || value.type !== "page") continue;
      const title = cleanTitle(extractNotionTitle(value.properties));
      if (!title) continue;
      const slug = title.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").replace(/-+/g, "-");
      const strippedId = blockId.replace(/-/g, "");
      jobsFound.push({
        company: config.company,
        title,
        // Notion's own stable URL shape: <workspace>/<Title>-<pageid>
        link: `${boardUrl.origin}/${slug}-${strippedId}`,
      });
    }
    // The collection JSON is authoritative, including a valid empty result set.
    return { company: config.company, source: queryResponse.url, jobs: dedupeDiscovered(jobsFound), canonical: true };
  } catch (error) {
    return {
      company: config.company,
      source: config.url,
      jobs: [],
      canonical: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function extractNotionTitle(properties?: Record<string, unknown>): string {
  const title = properties?.title;
  if (Array.isArray(title)) {
    const parts: string[] = [];
    for (const segment of title) {
      if (Array.isArray(segment) && typeof segment[0] === "string") parts.push(segment[0]);
    }
    if (parts.length) return parts.join("");
  }
  return "";
}

async function fetchBoard(config: BoardConfig): Promise<SourceResult> {
  if (config.kind === "ashby") return fetchConfiguredAshbyBoard(config);
  if (config.kind === "bamboo") return fetchBambooBoard(config);
  if (config.kind === "next") return fetchNextBoard(config);
  if (config.kind === "zenith") return fetchZenithBoard(config);
  if (config.kind === "notion") return fetchNotionBoard(config);
  return fetchHtmlBoard(config);
}

/** Detail enrichment: turn raw posting content into DB-ready fields. */

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function htmlToMarkdownish(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withBreaks = withoutScripts
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<h[1-6][^>]*>/gi, "\n\n**")
    .replace(/<li[^>]*>/gi, "\n- ");
  const text = withBreaks.replace(/<[^>]+>/g, "");
  return decodeHtmlEntities(text)
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

const DETAIL_SKIP_LINE = /^(you need to enable javascript|enable javascript to run this app|loading|please enable javascript)/i;

const RESPONSIBILITIES_HEADING =
  /^(key |core |primary )?(responsibilities|what you('ll| will) do|what you will own|the role|role overview|your mission|your responsibilities|key outcomes|what the job involves|day to day|day-to-day)(\s*[:\-–—])?$/i;
const QUALIFICATIONS_HEADING =
  /^(requirements?|qualifications?|what we('re| are) looking for|about you|who you are|your experience|your background|your profile|you('ll| will) bring|you have|you are|basic qualifications?|preferred qualifications?|minimum qualifications?|must have|nice to have|skills?( and experience)?|experience|profile)(\s*[:\-–—])?$/i;
const BENEFITS_HEADING =
  /^(benefits?( & perks)?|what we offer|why (work (here|with us|at [\w\s&'.-]+)|join us)|perks( & benefits?)?|compensation( & benefits?)?|offer|total rewards|life at [\w\s&'.-]+)(\s*[:\-–—])?$/i;
const DESCRIPTION_HEADING =
  /^(about the (role|position|job|team|company|opportunity|mission)|job description|position summary|overview|summary|description|introduction|the opportunity|the (role|position)|who we are|our mission|our company|about us|about [\w\s&'.-]+)(\s*[:\-–—])?$/i;
const GENERIC_NONCONTENT_HEADING =
  /^(location|reports to|reporting to|team|department|job type|employment type|workplace|work model|time type|requisition id|job id|posting id|apply|how to apply|interview process|hiring process|equal opportunity|eeo|diversity|contact|share|save|back to jobs|all jobs|related jobs|similar jobs|other openings|see more jobs)$/i;

function isHeadingLike(line: string): boolean {
  const t = line.trim().replace(/[:\-–—]+$/, "").trim();
  if (!t || t.length > 90) return false;
  if (/[.!?]$/.test(t)) return false;
  // ALL-CAPS short lines (e.g. "WHAT YOU'LL WORK ON") are real ATS headings.
  if (t === t.toUpperCase() && t.length >= 4 && /[A-Z]/.test(t)) return true;
  // Title-case-ish short lines without trailing punctuation.
  if (/^[A-Z0-9][A-Za-z0-9][A-Za-z0-9\s&'’\/.,+()-]{1,80}$/.test(t) && t.split(/\s+/).length <= 9) return true;
  return false;
}

function cleanBulletItem(line: string): string | null {
  const cleaned = line
    .replace(/^[-*\u2022\u25CF\u25AA\u27A2>\s]+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
  // Drop lone bullets / dashes left by JS-shell scraping (the empty-bullet bug).
  if (!cleaned || /^(and|or|the|with|for|a|an|to|in|on|at|-+|_+|\.+)$/i.test(cleaned)) return null;
  if (cleaned.length < 4) return null;
  return cleaned;
}

export interface DetailFields {
  description: string | null;
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  salary: string | null;
}

/**
 * Split a plain-text posting into description + responsibilities +
 * qualifications + benefits. Anything that cannot be classified stays in
 * `description` so content is never silently dropped.
 */
function splitPostingSections(plain: string): DetailFields {
  const lines = plain
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !DETAIL_SKIP_LINE.test(line));
  const buckets: Record<string, string[]> = {
    intro: [],
    description: [],
    responsibilities: [],
    qualifications: [],
    benefits: [],
  };
  let current = "intro";
  for (const line of lines) {
    const heading = line.replace(/[:\-–—]+$/, "").trim();
    if (RESPONSIBILITIES_HEADING.test(line) || RESPONSIBILITIES_HEADING.test(heading)) {
      current = "responsibilities";
      continue;
    }
    if (QUALIFICATIONS_HEADING.test(line) || QUALIFICATIONS_HEADING.test(heading)) {
      current = "qualifications";
      continue;
    }
    if (BENEFITS_HEADING.test(line) || BENEFITS_HEADING.test(heading)) {
      current = "benefits";
      continue;
    }
    if (DESCRIPTION_HEADING.test(line) || DESCRIPTION_HEADING.test(heading)) {
      current = "description";
      continue;
    }
    if (GENERIC_NONCONTENT_HEADING.test(line) || GENERIC_NONCONTENT_HEADING.test(heading)) continue;
    if (isHeadingLike(line) && line.length <= 60) {
      const lower = line.toLowerCase();
      if (/responsib|what you.*do|will own|day.to.day|mission|outcome/.test(lower)) current = "responsibilities";
      else if (/requirement|qualification|looking for|about you|who you|experience|background|profile|you.*bring|nice to have|must have|skill/.test(lower))
        current = "qualifications";
      else if (/benefit|perk|offer|compensation|why (join|work)|life at|total rewards/.test(lower)) current = "benefits";
      else current = "description";
      continue;
    }
    buckets[current].push(line);
  }
  const normalizeList = (raw: string[]): string[] => {
    const items: string[] = [];
    for (const line of raw) {
      const item = cleanBulletItem(line);
      if (item) items.push(item);
    }
    return [...new Set(items)].slice(0, 24);
  };
  const descriptionLines = [...buckets.intro, ...buckets.description].filter(Boolean);
  const description = descriptionLines.join("\n\n").trim().slice(0, 12000) || null;
  return {
    description,
    responsibilities: normalizeList(buckets.responsibilities),
    qualifications: normalizeList(buckets.qualifications),
    benefits: normalizeList(buckets.benefits),
    salary: null,
  };
}

function ashbySalaryOf(posting: AshbyPosting): string | null {
  const direct =
    posting.scrapeableCompensationSalarySummary ?? posting.compensationTierSummary ?? null;
  const cleaned = squash(direct);
  return cleaned || null;
}

function detailsFromAshby(posting: AshbyPosting): DetailFields {
  const plain = squash(posting.descriptionPlain ?? "");
  const html = posting.descriptionHtml ?? "";
  const source = plain.length >= 200 ? posting.descriptionPlain! : html ? htmlToMarkdownish(html) : "";
  const split = splitPostingSections(source);
  if (!split.description && plain.length >= 50) {
    split.description = plain.slice(0, 12000);
  }
  split.salary = ashbySalaryOf(posting);
  return split;
}

function detailsFromHtml(html: string, pageUrl: string): DetailFields | null {
  const $ = load(html);
  $("script, style, nav, header, footer, form").remove();
  const selectors = [
    '[class*="job-desc"]',
    '[class*="jobDescription"]',
    '[class*="job-description"]',
    '[class*="position-desc"]',
    '[id*="job-desc"]',
    '[class*="posting"]',
    "article",
    "main",
  ];
  let best = "";
  for (const selector of selectors) {
    const text = squash($(selector).first().text());
    if (text.length > best.length) best = text;
  }
  if (best.length < 200) {
    // Fall back to body text minus obvious nav noise.
    const body = squash($("body").text());
    if (body.length < 200) return null;
    best = body;
  }
  if (/you need to enable javascript/i.test(best) && best.length < 600) return null;
  const split = splitPostingSections(best.replace(/\. /g, ".\n"));
  if (!split.description || split.description.length < 200) return null;
  return split;
}

/** Best-effort detail fetch for boards without a structured description API. */
async function fetchDetailHtml(url: string): Promise<DetailFields | null> {
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;
    const html = await response.text();
    if (html.length > 2_000_000) return null;
    return detailsFromHtml(html, response.url);
  } catch {
    return null;
  }
}

function normalizeEmploymentType(value: string | null | undefined): string | null {
  const normalized = squash(value).toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("full")) return "Full-time";
  if (normalized.includes("part")) return "Part-time";
  if (normalized.includes("contract")) return "Contract";
  if (normalized.includes("intern")) return "Internship";
  return squash(value);
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function classifyJob(job: DiscoveredJob): { department: string | null; tags: string[] } {
  const text = `${job.title} ${job.department ?? ""}`.toLowerCase();
  const tags = new Set<string>();
  let department = job.department ? slugify(job.department) : null;

  if (/intern|working student|early career|graduate/.test(text)) tags.add(/intern|working student/.test(text) ? "internship" : "entry-level");
  if (/head of|director|chief|vice president|\bvp\b|\blead\b/.test(text)) tags.add("leadership");
  if (/manager/.test(text)) tags.add("management");
  if (/rust/.test(text)) tags.add("rust");
  if (/solidity|smart contract|evm|blockchain|crypto/.test(text)) tags.add("web3");
  if (/defi|lending|liquidity|trading/.test(text)) tags.add("defi");
  if (/security|cryptograph/.test(text)) tags.add("security");
  if (/zero.?knowledge|\bzk\b/.test(text)) tags.add("zkp");
  if (/machine learning|\bml\b|artificial intelligence|\bai\b/.test(text)) tags.add("ai");
  if (/research|scientist/.test(text)) tags.add("research");
  if (/backend|platform|infrastructure/.test(text)) tags.add("backend");
  if (/front.?end/.test(text)) tags.add("frontend");
  if (/full.?stack/.test(text)) tags.add("fullstack");
  if (/android/.test(text)) tags.add("android");
  if (/ios|mobile/.test(text)) tags.add("mobile");
  if (/product/.test(text)) tags.add("product");
  if (/sales|account manager/.test(text)) tags.add("sales");
  if (/business development|partnership|\bbd\b/.test(text)) tags.add("bd");
  if (/growth|gtm/.test(text)) tags.add("growth");
  if (/talent|recruit|people|human resources|\bhr\b/.test(text)) tags.add("talent");
  if (/accounting/.test(text)) tags.add("accounting");

  if (!department) {
    if (/engineer|developer|infrastructure|platform|technical/.test(text)) department = "engineering";
    else if (/research|scientist/.test(text)) department = "research";
    else if (/data|analytics/.test(text)) department = "data";
    else if (/product/.test(text)) department = "product";
    else if (/design/.test(text)) department = "design";
    else if (/security/.test(text)) department = "security";
    else if (/legal|counsel/.test(text)) department = "legal";
    else if (/finance|accounting/.test(text)) department = "finance";
    else if (/talent|recruit|people|human resources|\bhr\b/.test(text)) department = "hr";
    else if (/business development|partnership|sales|account manager|gtm/.test(text)) department = "business-development";
    else if (/marketing|growth/.test(text)) department = "marketing";
    else if (/operations/.test(text)) department = "operations";
  }
  return { department, tags: [...tags] };
}

function indexByIdentity(rows: JobRow[]): Map<string, JobRow> {
  const index = new Map<string, JobRow>();
  for (const row of rows) {
    const key = normalizeJobLink(row.link);
    if (!index.has(key)) index.set(key, row);
  }
  return index;
}

function makeInsert(job: DiscoveredJob, template: JobRow, id: string, allowedTags: Set<string>) {
  const classification = classifyJob(job);
  const tags = [...new Set([...(COMPANY_TAGS[job.company] ?? []), ...classification.tags])].filter((tag) => allowedTags.has(tag));
  return {
    id,
    title: job.title,
    company: job.company,
    companyLogo: template.companyLogo,
    link: job.link,
    location: job.location ?? null,
    remote: job.remote ?? null,
    type: normalizeEmploymentType(job.type) ?? "Full-time",
    salary: job.salary ?? null,
    department: classification.department,
    tags,
    category: template.category,
    featured: false,
    description: job.description?.trim() ? job.description.trim().slice(0, 12000) : null,
    responsibilities: job.responsibilities?.length ? job.responsibilities.slice(0, 24) : null,
    qualifications: job.qualifications?.length ? job.qualifications.slice(0, 24) : null,
    benefits: job.benefits?.length ? job.benefits.slice(0, 24) : null,
    companyWebsite: template.companyWebsite,
    companyX: template.companyX,
    companyGithub: template.companyGithub,
  };
}

async function connect(label: string, url: string) {
  const sql = postgres(url, { max: 1, socket: () => createPreferredPostgresSocket(url) });
  const db = drizzle(sql, { schema: { jobs, jobTags } });
  return { label, sql, db };
}

async function readRows(connection: Awaited<ReturnType<typeof connect>>): Promise<JobRow[]> {
  return (await connection.db
    .select({
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      companyLogo: jobs.companyLogo,
      link: jobs.link,
      location: jobs.location,
      remote: jobs.remote,
      type: jobs.type,
      department: jobs.department,
      tags: jobs.tags,
      category: jobs.category,
      companyWebsite: jobs.companyWebsite,
      companyX: jobs.companyX,
      companyGithub: jobs.companyGithub,
    })
    .from(jobs)) as JobRow[];
}

function formatIssue(result: LivenessResult): string {
  return `  [${result.status.toUpperCase()}] ${result.job.company} - ${result.job.title}\n    ${result.job.link}\n    -> ${result.reason}`;
}

/**
 * Backfill mode (`--backfill`): for every row whose description is empty,
 * re-resolve details from the authoritative source (Ashby API matched by
 * stable identity, Zenith API matched by slug, else the posting page itself)
 * and update BOTH databases. Never clears an existing description.
 */
async function backfillMissingDetails(
  prod: Awaited<ReturnType<typeof connect>>,
  staging: Awaited<ReturnType<typeof connect>>,
  allRows: JobRow[],
  sourceResults: SourceResult[],
) {
  const seen = new Map<string, JobRow>();
  for (const row of allRows) {
    const key = normalizeJobLink(row.link);
    if (!seen.has(key)) seen.set(key, row);
  }
  // Build ATS lookup tables from this run's canonical board data.
  const ashbyByIdentity = new Map<string, DiscoveredJob>();
  const zenithByIdentity = new Map<string, DiscoveredJob>();
  for (const result of sourceResults) {
    const isAshby = result.source.startsWith("Ashby:") || result.source.includes("posting-api/job-board/");
    const isZenith = result.source.includes("zenith.network");
    for (const job of result.jobs) {
      const identity = normalizeJobLink(job.link);
      if (isAshby && job.description?.trim()) ashbyByIdentity.set(identity, job);
      if (isZenith && job.description?.trim()) zenithByIdentity.set(identity, job);
    }
  }
  const targets = [...seen.values()];
  console.log(`> Backfill: ${targets.length} unique postings to check`);
  let checked = 0;
  let updated = 0;
  let stillMissing = 0;
  const stillMissingRows: JobRow[] = [];
  const BATCH = 6;
  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (row) => {
        const identity = normalizeJobLink(row.link);
        const direct = ashbyByIdentity.get(identity) ?? zenithByIdentity.get(identity);
        if (direct?.description?.trim()) {
          return {
            row,
            description: direct.description.trim().slice(0, 12000),
            responsibilities: direct.responsibilities?.length ? direct.responsibilities.slice(0, 24) : null,
            qualifications: direct.qualifications?.length ? direct.qualifications.slice(0, 24) : null,
            benefits: direct.benefits?.length ? direct.benefits.slice(0, 24) : null,
            salary: direct.salary ?? null,
          };
        }
        const details = await fetchDetailHtml(row.link);
        if (!details?.description) return { row, description: null as string | null };
        return {
          row,
          description: details.description,
          responsibilities: details.responsibilities.length ? details.responsibilities : null,
          qualifications: details.qualifications.length ? details.qualifications : null,
          benefits: details.benefits.length ? details.benefits : null,
          salary: details.salary,
        };
      }),
    );
    for (const r of results) {
      checked++;
      if (!r.description) {
        stillMissing++;
        stillMissingRows.push(r.row);
        continue;
      }
      const patch: Record<string, unknown> = {};
      // Only fill blanks: existing content is authoritative and never overwritten.
      // (Checked below against live prod/staging values before writing.)
      patch["description"] = r.description;
      if (r.responsibilities?.length) patch["responsibilities"] = r.responsibilities;
      if (r.qualifications?.length) patch["qualifications"] = r.qualifications;
      if (r.benefits?.length) patch["benefits"] = r.benefits;
      if (r.salary) patch["salary"] = r.salary;
      void patch;
      (r as { patch?: Record<string, unknown> }).patch = patch;
      void updated;
    }
    // Write per-row with a freshness re-check so concurrent edits are safe.
    for (const r of results) {
      if (!r.description) continue;
      const p = (r as { patch?: Record<string, unknown> }).patch!;
      for (const conn of [prod, staging]) {
        const current = await conn.db
          .select({
            id: jobs.id,
            description: jobs.description,
            responsibilities: jobs.responsibilities,
            qualifications: jobs.qualifications,
            benefits: jobs.benefits,
            salary: jobs.salary,
          })
          .from(jobs)
          .where(eq(jobs.id, r.row.id));
        if (!current.length) continue;
        const cur = current[0];
        if (cur.description?.trim()) continue;
        const update: Record<string, unknown> = { description: p["description"], updatedAt: new Date() };
        if (!cur.responsibilities?.length && p["responsibilities"]) update["responsibilities"] = p["responsibilities"];
        if (!cur.qualifications?.length && p["qualifications"]) update["qualifications"] = p["qualifications"];
        if (!cur.benefits?.length && p["benefits"]) update["benefits"] = p["benefits"];
        if (!cur.salary && p["salary"]) update["salary"] = p["salary"];
        await conn.db.update(jobs).set(update).where(eq(jobs.id, r.row.id));
        updated++;
      }
    }
    console.log(`  progress: ${checked}/${targets.length} (updated writes: ${updated}, still missing: ${stillMissing})`);
  }
  console.log(`\nBackfill done: ${updated} row-writes, ${stillMissing} postings still without details`);
  if (stillMissingRows.length) {
    console.log("-- Still missing (source has no parseable description) --");
    for (const row of stillMissingRows.slice(0, 40))
      console.log(`  ${row.company} - ${row.title}\n    ${row.link}`);
    if (stillMissingRows.length > 40) console.log(`  ... and ${stillMissingRows.length - 40} more`);
  }
}

async function main() {
  const execute = process.argv.includes("--execute");
  const backfillOnly = process.argv.includes("--backfill");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
  if (!process.env.DATABASE_URL_STAGING) throw new Error("DATABASE_URL_STAGING not set");

  const prod = await connect("PROD", process.env.DATABASE_URL);
  const staging = await connect("STAGING", process.env.DATABASE_URL_STAGING);

  try {
    const [prodRows, stagingRows] = await Promise.all([readRows(prod), readRows(staging)]);
    console.log(`Auditing ${prodRows.length} production jobs across ${new Set(prodRows.map((row) => row.company)).size} companies`);
    console.log(`Mode: ${execute ? "EXECUTE (delete + add)" : "REPORT (no writes)"}\n`);

    const prodIdentitySet = new Set(prodRows.map((row) => normalizeJobLink(row.link)));
    const stagingOnlyRows = stagingRows.filter((row) => !prodIdentitySet.has(normalizeJobLink(row.link)));
    console.log(`> Step 1/4 liveness-check ${prodRows.length} production URLs${stagingOnlyRows.length ? ` + ${stagingOnlyRows.length} staging-only URLs` : ""} (concurrency=${CONCURRENCY})`);
    const prodLiveness = await poolMap(prodRows, CONCURRENCY, checkOne);
    // Staging can retain rows that earlier syncs did not mirror to production. Check those too.
    const stagingOnlyLiveness = await poolMap(stagingOnlyRows, CONCURRENCY, checkOne);
    const liveness = [...prodLiveness, ...stagingOnlyLiveness];
    const dead = liveness.filter((result) => result.status === "dead");
    const ambiguous = liveness.filter((result) => result.status === "ambiguous");
    const errored = liveness.filter((result) => result.status === "error");
    console.log(`  live: ${liveness.length - dead.length - ambiguous.length - errored.length}   dead: ${dead.length}   ambiguous: ${ambiguous.length}   errored: ${errored.length}`);
    if (dead.length) {
      console.log("\n-- HTTP-dead --");
      for (const result of dead) console.log(formatIssue(result));
    }

    console.log("\n> Step 2/4 reconcile ATS and careers boards");
    const sourceResults: SourceResult[] = [];
    const ashbyByOrg = new Map<string, JobRow[]>();
    for (const row of prodRows) {
      const org = extractAshbyOrg(row.link);
      if (!org) continue;
      const list = ashbyByOrg.get(org) ?? [];
      list.push(row);
      ashbyByOrg.set(org, list);
    }

    // Ashby calls stay sequential: concurrent calls can falsely return zero jobs on large boards.
    for (const [org, rows] of ashbyByOrg) {
      const { postings, error } = await fetchAshbyOrg(org);
      const company = rows[0].company;
      const discovered = postings.map((posting): DiscoveredJob => {
        const details = detailsFromAshby(posting);
        return {
          company,
          title: posting.title,
          link: posting.jobUrl,
          location: posting.locationName ?? null,
          remote: posting.isRemote ? "Remote" : /\bremote\b/i.test(posting.locationName ?? "") ? "Remote" : null,
          type: posting.employmentType ?? null,
          department: posting.department ?? null,
          description: details.description,
          responsibilities: details.responsibilities.length ? details.responsibilities : null,
          qualifications: details.qualifications.length ? details.qualifications : null,
          benefits: details.benefits.length ? details.benefits : null,
          salary: details.salary,
        };
      });
      console.log(`  Ashby ${org}: ${error ? `ERROR (${error})` : `${discovered.length} live`}`);
      sourceResults.push({ company, source: `Ashby:${org}`, jobs: dedupeDiscovered(discovered), canonical: !error, error });
    }

    const nonAshby = new Map<string, JobRow[]>();
    for (const row of prodRows) {
      if (extractAshbyOrg(row.link)) continue;
      const list = nonAshby.get(row.company) ?? [];
      list.push(row);
      nonAshby.set(row.company, list);
    }
    for (const [company, rows] of nonAshby) {
      const config = getBoardConfig(company, rows[0]);
      if (!config) {
        console.log(`  ${company}: no machine-readable board configured (liveness-only)`);
        continue;
      }
      if (config.skip) {
        console.log(`  ${company}: skipped (liveness-only)`);
        continue;
      }
      const result = await fetchBoard(config);
      console.log(`  ${company}: ${result.error ? `ERROR (${result.error})` : `${result.jobs.length} discovered${result.canonical ? " (canonical)" : " (add-only)"}`}`);
      sourceResults.push(result);
    }

    const canonicalDead = new Map<string, JobRow>();
    for (const result of sourceResults) {
      if (!result.canonical) continue;
      const liveLinks = new Set(result.jobs.map((job) => normalizeJobLink(job.link)));
      for (const row of [...prodRows, ...stagingRows]) {
        const isAshby = Boolean(extractAshbyOrg(row.link));
        const sourceIsAshby = result.source.startsWith("Ashby:") || result.source.includes("posting-api/job-board/");
        if (row.company !== result.company || isAshby !== sourceIsAshby) continue;
        if (!liveLinks.has(normalizeJobLink(row.link))) canonicalDead.set(row.id, row);
      }
    }
    if (canonicalDead.size) {
      console.log("\n-- Canonical-dead (not returned by its source board) --");
      for (const row of canonicalDead.values()) console.log(`  ${row.company} - ${row.title}\n    ${row.link}`);
    }

    const candidatesByIdentity = new Map<string, DiscoveredJob>();
    for (const result of sourceResults) {
      for (const job of result.jobs) {
        const identity = normalizeJobLink(job.link);
        if (!candidatesByIdentity.has(identity)) candidatesByIdentity.set(identity, job);
      }
    }

    const prodByIdentity = indexByIdentity(prodRows);
    const stagingByIdentity = indexByIdentity(stagingRows);

    if (backfillOnly) {
      await backfillMissingDetails(prod, staging, [...prodRows, ...stagingRows], sourceResults);
      return;
    }

    // Step 3b: candidates from boards without a structured description API
    // (BambooHR, generic HTML, Notion, Next) carry no detail fields. Fetch
    // each new posting's own page best-effort so inserts never land empty.
    const needDetail = [...candidatesByIdentity.entries()].filter(
      ([identity, job]) =>
        (!prodByIdentity.has(identity) || !stagingByIdentity.has(identity)) &&
        !job.description?.trim(),
    );
    if (needDetail.length) {
      console.log(`> Step 3b/4 enrich ${needDetail.length} new listings with posting details`);
      const enriched = await poolMap(needDetail, 6, async ([identity, job]) => {
        const details = await fetchDetailHtml(job.link);
        return { identity, job, details };
      });
      let enrichedCount = 0;
      for (const { identity, job, details } of enriched) {
        if (!details?.description) continue;
        enrichedCount++;
        candidatesByIdentity.set(identity, {
          ...job,
          description: details.description,
          responsibilities: details.responsibilities.length ? details.responsibilities : null,
          qualifications: details.qualifications.length ? details.qualifications : null,
          benefits: details.benefits.length ? details.benefits : null,
          salary: details.salary,
        });
      }
      console.log(`  enriched: ${enrichedCount}/${needDetail.length}`);
    }

    const newOnProd = [...candidatesByIdentity.entries()].filter(([identity]) => !prodByIdentity.has(identity));
    console.log(`\n> Step 3/4 new listings: ${newOnProd.length} absent from production`);
    for (const [, job] of newOnProd) console.log(`  [NEW] ${job.company} - ${job.title}\n    ${job.link}`);

    const deadIdentities = new Set([
      ...dead.map((result) => normalizeJobLink(result.job.link)),
      ...[...canonicalDead.values()].map((row) => normalizeJobLink(row.link)),
    ]);
    const prodDeleteIds = prodRows.filter((row) => deadIdentities.has(normalizeJobLink(row.link))).map((row) => row.id);
    const stagingDeleteIds = stagingRows.filter((row) => deadIdentities.has(normalizeJobLink(row.link))).map((row) => row.id);

    const templates = new Map<string, JobRow>();
    for (const row of [...prodRows, ...stagingRows]) if (!templates.has(row.company)) templates.set(row.company, row);
    const tags = await prod.db.select({ slug: jobTags.slug }).from(jobTags);
    const allowedTags: Set<string> = new Set(tags.map((tag) => tag.slug as string));

    const missingTemplate: DiscoveredJob[] = [];
    const inserts = new Map<string, ReturnType<typeof makeInsert>>();
    for (const [identity, job] of candidatesByIdentity) {
      const missingInProd = !prodByIdentity.has(identity);
      const missingInStaging = !stagingByIdentity.has(identity);
      if (!missingInProd && !missingInStaging) continue;
      const template = templates.get(job.company);
      if (!template) {
        missingTemplate.push(job);
        continue;
      }
      const existing = prodByIdentity.get(identity) ?? stagingByIdentity.get(identity);
      inserts.set(identity, makeInsert(job, template, existing?.id ?? createId(), allowedTags));
    }

    if (missingTemplate.length) {
      console.log("\n-- Cannot add: no existing company metadata template --");
      for (const job of missingTemplate) console.log(`  ${job.company} - ${job.title}\n    ${job.link}`);
    }

    if (!execute) {
      console.log(`\n> Step 4/4 report only`);
      console.log(`  would delete: prod ${prodDeleteIds.length}, staging ${stagingDeleteIds.length}`);
      console.log(`  would add: prod ${[...inserts.keys()].filter((identity) => !prodByIdentity.has(identity)).length}, staging ${[...inserts.keys()].filter((identity) => !stagingByIdentity.has(identity)).length}`);
      console.log(`  ambiguous left alone: ${ambiguous.length}; errored left alone: ${errored.length}`);
      return;
    }

    console.log("\n> Step 4/4 apply deletes and additions");
    const prodDeleted = prodDeleteIds.length
      ? await prod.db.delete(jobs).where(inArray(jobs.id, prodDeleteIds)).returning({ id: jobs.id })
      : [];
    const stagingDeleted = stagingDeleteIds.length
      ? await staging.db.delete(jobs).where(inArray(jobs.id, stagingDeleteIds)).returning({ id: jobs.id })
      : [];

    let prodAdded = 0;
    let stagingAdded = 0;
    for (const [identity, insert] of inserts) {
      if (!prodByIdentity.has(identity)) {
        await prod.db.insert(jobs).values(insert);
        prodAdded++;
        // The site deep-links each posting via its record id (View details -> /jobs?job=<id>).
        console.log(`  [ADDED] ${insert.company} - ${insert.title}\n    https://dcbuilder.dev/jobs?job=${insert.id}`);
      }
      if (!stagingByIdentity.has(identity)) {
        await staging.db.insert(jobs).values(insert);
        stagingAdded++;
      }
    }
    console.log(`  PROD deleted: ${prodDeleted.length}; added: ${prodAdded}`);
    console.log(`  STAGING deleted: ${stagingDeleted.length}; added: ${stagingAdded}`);
    console.log(`  ambiguous left alone: ${ambiguous.length}; errored left alone: ${errored.length}`);
  } finally {
    await prod.sql.end({ timeout: 5 });
    await staging.sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
