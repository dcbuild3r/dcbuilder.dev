import * as cheerio from "cheerio";

export interface JobBoardSource {
  name: string;
  url: string;
  category?: "portfolio" | "network";
  company?: string;
  listSelector?: string;
  jobLinkPattern?: string;
  closedMarkers?: string[];
}

export interface ParsedJobLink {
  link: string;
  title: string;
}

const DEFAULT_CLOSED_MARKERS = [
  "position has been filled",
  "position is no longer available",
  "job is no longer available",
  "this job has expired",
  "role has been filled",
  "no openings at this time",
];

export function canonicalizeJobUrl(url: string): string {
  const parsed = new URL(url);

  // Remove tracking and pagination params
  const keepParams = new URLSearchParams();
  parsed.searchParams.forEach((value, key) => {
    if (!key.toLowerCase().startsWith("utm_") && key !== "ref" && key !== "source") {
      keepParams.append(key, value);
    }
  });

  parsed.search = keepParams.toString();
  parsed.hash = "";

  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
}

function deriveTitleFromUrl(url: string): string {
  const parsed = new URL(url);
  const slug = parsed.pathname.split("/").filter(Boolean).pop() || "Job";
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function extractJobLinksFromHtml(source: JobBoardSource, html: string): ParsedJobLink[] {
  const $ = cheerio.load(html);
  const selector = source.listSelector || "a[href]";
  const pattern = source.jobLinkPattern ? new RegExp(source.jobLinkPattern, "i") : null;

  const linksByUrl = new Map<string, ParsedJobLink>();
  $(selector).each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    try {
      const absolute = new URL(href, source.url).toString();
      if (pattern && !pattern.test(absolute)) return;
      if (!absolute.startsWith("http://") && !absolute.startsWith("https://")) return;

      const canonical = canonicalizeJobUrl(absolute);
      const rawTitle = $(element).text().trim();
      const title = rawTitle || deriveTitleFromUrl(canonical);

      if (!linksByUrl.has(canonical)) {
        linksByUrl.set(canonical, { link: canonical, title });
      }
    } catch {
      // Ignore malformed URLs
    }
  });

  return Array.from(linksByUrl.values());
}

export function detectTermination(params: {
  status: number;
  bodyText?: string;
  finalUrl?: string;
  jobUrl: string;
  sourceUrl: string;
  closedMarkers?: string[];
}): { terminated: boolean; reason: string } {
  const markerList = (params.closedMarkers || DEFAULT_CLOSED_MARKERS).map((marker) => marker.toLowerCase());
  const status = params.status;

  if (status === 404 || status === 410) {
    return { terminated: true, reason: `http_${status}` };
  }

  const finalUrl = params.finalUrl ? canonicalizeJobUrl(params.finalUrl) : canonicalizeJobUrl(params.jobUrl);
  const sourceUrl = canonicalizeJobUrl(params.sourceUrl);
  const jobUrl = canonicalizeJobUrl(params.jobUrl);

  if (finalUrl !== jobUrl && finalUrl === sourceUrl) {
    return { terminated: true, reason: "redirected_to_board_home" };
  }

  const body = (params.bodyText || "").toLowerCase();
  const marker = markerList.find((entry) => body.includes(entry));
  if (marker) {
    return { terminated: true, reason: `content_marker:${marker}` };
  }

  return { terminated: false, reason: "active" };
}
