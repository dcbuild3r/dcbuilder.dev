import { readFile } from "fs/promises";
import { resolve } from "path";
import { and, eq, inArray } from "drizzle-orm";
import { db, jobs } from "@/db";
import { JobBoardSource, detectTermination, extractJobLinksFromHtml } from "@/lib/job-board-sync";

type SourceRunSummary = {
  source: string;
  discovered: number;
  inserted: number;
  updated: number;
  reactivated: number;
  terminated: number;
  checked: number;
  errors: string[];
};

export type JobBoardSyncSummary = {
  dryRun: boolean;
  startedAt: string;
  finishedAt: string;
  sourcesProcessed: number;
  totals: {
    discovered: number;
    inserted: number;
    updated: number;
    reactivated: number;
    terminated: number;
    checked: number;
  };
  bySource: SourceRunSummary[];
};

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function validateSource(source: Partial<JobBoardSource>): source is JobBoardSource {
  return Boolean(source.name && source.url);
}

async function loadSourcesFromConfigFile(): Promise<JobBoardSource[]> {
  const configPath = resolve(process.cwd(), "job-board-sources.json");
  try {
    const raw = await readFile(configPath, "utf-8");
    const parsed = safeJsonParse<Partial<JobBoardSource>[]>(raw);
    if (!parsed) return [];
    return parsed.filter(validateSource);
  } catch {
    return [];
  }
}

export async function loadJobBoardSources(): Promise<JobBoardSource[]> {
  const envConfig = process.env.JOB_BOARD_SOURCES_JSON;
  if (envConfig) {
    const parsed = safeJsonParse<Partial<JobBoardSource>[]>(envConfig);
    if (!parsed) {
      throw new Error("JOB_BOARD_SOURCES_JSON is not valid JSON");
    }

    const valid = parsed.filter(validateSource);
    if (valid.length === 0) {
      throw new Error("JOB_BOARD_SOURCES_JSON contains no valid sources");
    }
    return valid;
  }

  return loadSourcesFromConfigFile();
}

async function fetchWithRetry(url: string, maxAttempts: number = 3): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "dcbuilder-job-sync/1.0" },
      });
    } catch (error) {
      lastError = error;
      const waitMs = 300 * attempt;
      await new Promise((resolveWait) => setTimeout(resolveWait, waitMs));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to fetch URL");
}

function toIso(value: Date): string {
  return value.toISOString();
}

async function processSource(source: JobBoardSource, dryRun: boolean): Promise<SourceRunSummary> {
  const now = new Date();
  const summary: SourceRunSummary = {
    source: source.name,
    discovered: 0,
    inserted: 0,
    updated: 0,
    reactivated: 0,
    terminated: 0,
    checked: 0,
    errors: [],
  };

  try {
    const listResponse = await fetchWithRetry(source.url);
    if (!listResponse.ok) {
      summary.errors.push(`Failed to fetch board URL (${listResponse.status})`);
      return summary;
    }

    const html = await listResponse.text();
    const parsedLinks = extractJobLinksFromHtml(source, html);
    summary.discovered = parsedLinks.length;

    const discoveredLinks = parsedLinks.map((item) => item.link);
    const globalMatches = discoveredLinks.length > 0
      ? await db
        .select({
          id: jobs.id,
          link: jobs.link,
          terminated: jobs.terminated,
          sourceBoard: jobs.sourceBoard,
          company: jobs.company,
          title: jobs.title,
        })
        .from(jobs)
        .where(inArray(jobs.link, discoveredLinks))
      : [];
    const globalByLink = new Map(globalMatches.map((job) => [job.link, job]));

    const existingJobs = await db
      .select({
        id: jobs.id,
        link: jobs.link,
        terminated: jobs.terminated,
        sourceBoard: jobs.sourceBoard,
        company: jobs.company,
        title: jobs.title,
      })
      .from(jobs)
      .where(eq(jobs.sourceBoard, source.name));

    const existingByLink = new Map(existingJobs.map((job) => [job.link, job]));
    const seenLinks = new Set<string>();

    for (const parsedJob of parsedLinks) {
      seenLinks.add(parsedJob.link);
      const globalExisting = globalByLink.get(parsedJob.link);
      const existing = globalExisting || existingByLink.get(parsedJob.link);
      const company = source.company || new URL(source.url).hostname.replace(/^www\./, "");
      const category = source.category || "network";

      if (!existing) {
        // Fallback dedupe when URL changed but logical job tuple is unchanged.
        const [fallbackMatch] = await db
          .select({
            id: jobs.id,
            link: jobs.link,
            terminated: jobs.terminated,
            sourceBoard: jobs.sourceBoard,
            company: jobs.company,
            title: jobs.title,
          })
          .from(jobs)
          .where(and(eq(jobs.company, company), eq(jobs.title, parsedJob.title)))
          .limit(1);

        if (fallbackMatch) {
          summary.updated += 1;
          if (fallbackMatch.terminated) {
            summary.reactivated += 1;
          }
          if (!dryRun) {
            await db
              .update(jobs)
              .set({
                link: parsedJob.link,
                category,
                sourceBoard: source.name,
                sourceUrl: source.url,
                sourceExternalId: parsedJob.link,
                terminated: false,
                terminatedAt: null,
                terminationReason: null,
                lastCheckedAt: now,
                updatedAt: now,
              })
              .where(eq(jobs.id, fallbackMatch.id));
          }
          continue;
        }

        summary.inserted += 1;
        if (!dryRun) {
          await db.insert(jobs).values({
            title: parsedJob.title,
            company,
            link: parsedJob.link,
            category,
            sourceBoard: source.name,
            sourceUrl: source.url,
            sourceExternalId: parsedJob.link,
            terminated: false,
            terminatedAt: null,
            terminationReason: null,
            lastCheckedAt: now,
            createdAt: now,
            updatedAt: now,
          });
        }
        continue;
      }

      summary.updated += 1;
      if (existing.terminated) {
        summary.reactivated += 1;
      }
      if (!dryRun) {
        await db
          .update(jobs)
          .set({
            title: parsedJob.title,
            company,
            category,
            sourceBoard: source.name,
            sourceUrl: source.url,
            sourceExternalId: parsedJob.link,
            terminated: false,
            terminatedAt: null,
            terminationReason: null,
            lastCheckedAt: now,
            updatedAt: now,
          })
          .where(eq(jobs.id, existing.id));
      }
    }

    const activeExisting = existingJobs.filter((job) => !job.terminated);
    for (const job of activeExisting) {
      if (seenLinks.has(job.link)) continue;
      summary.checked += 1;

      let terminated = false;
      let reason = "active";
      try {
        const detailResponse = await fetchWithRetry(job.link);
        const body = await detailResponse.text();
        const detection = detectTermination({
          status: detailResponse.status,
          bodyText: body,
          finalUrl: detailResponse.url,
          jobUrl: job.link,
          sourceUrl: source.url,
          closedMarkers: source.closedMarkers,
        });
        terminated = detection.terminated;
        reason = detection.reason;
      } catch (error) {
        summary.errors.push(`Termination check failed for ${job.link}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }

      if (terminated) {
        summary.terminated += 1;
      }

      if (!dryRun) {
        await db
          .update(jobs)
          .set({
            terminated,
            terminatedAt: terminated ? now : null,
            terminationReason: terminated ? reason : null,
            lastCheckedAt: now,
            updatedAt: now,
          })
          .where(and(eq(jobs.id, job.id), eq(jobs.sourceBoard, source.name)));
      }
    }
  } catch (error) {
    summary.errors.push(error instanceof Error ? error.message : "Unknown source processing error");
  }

  return summary;
}

export async function syncJobBoards(options?: { dryRun?: boolean; sourceName?: string }): Promise<JobBoardSyncSummary> {
  const startedAt = new Date();
  const dryRun = Boolean(options?.dryRun);
  const allSources = await loadJobBoardSources();
  const sources = options?.sourceName
    ? allSources.filter((source) => source.name === options.sourceName)
    : allSources;

  const bySource: SourceRunSummary[] = [];
  for (const source of sources) {
    const summary = await processSource(source, dryRun);
    bySource.push(summary);
  }

  const totals = bySource.reduce(
    (acc, current) => ({
      discovered: acc.discovered + current.discovered,
      inserted: acc.inserted + current.inserted,
      updated: acc.updated + current.updated,
      reactivated: acc.reactivated + current.reactivated,
      terminated: acc.terminated + current.terminated,
      checked: acc.checked + current.checked,
    }),
    { discovered: 0, inserted: 0, updated: 0, reactivated: 0, terminated: 0, checked: 0 }
  );

  return {
    dryRun,
    startedAt: toIso(startedAt),
    finishedAt: toIso(new Date()),
    sourcesProcessed: bySource.length,
    totals,
    bySource,
  };
}
