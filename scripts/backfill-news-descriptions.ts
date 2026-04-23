/**
 * Backfill missing descriptions for curated links and announcements.
 *
 * Usage:
 *   bunx dotenv -e .env.local -- bun run scripts/backfill-news-descriptions.ts
 *   bunx dotenv -e .env.local -- bun run scripts/backfill-news-descriptions.ts --write
 *
 * Dry-run mode writes proposals to /tmp/news-description-backfill-proposals.json.
 */

import { writeFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { announcements, curatedLinks } from "../src/db/schema";
import {
  buildFallbackNewsDescription,
  isMevLetterItem,
  isGenericMevLetterDescription,
  resolveMevLetterDescription,
} from "../src/lib/news-description-style";

type BackfillTable = "announcement" | "curated";

type BackfillItem = {
  id: string;
  table: BackfillTable;
  title: string;
  url: string;
  description: string | null;
  source: string | null;
  company: string | null;
  category: string;
};

type Proposal = BackfillItem & {
  description: string;
  via: "fallback" | "manual" | "site-metadata" | "x-metadata";
};

const DRY_RUN_OUTPUT_PATH = "/tmp/news-description-backfill-proposals.json";
const MANUAL_DESCRIPTIONS: Record<string, string> = {
  "megaeth-post":
    "MegaETH's public mainnet will launch on February 9, 2026.",
  "avi-schiffmann-post":
    "A Friend user interview explores how people in rural America are using AI in everyday life.",
  t4hqh585bcncnzuemks7yxtz:
    "Aztec's upcoming token generation event and the key things to watch as launch approaches.",
  du8e49w55d9teu1h959sl8bq:
    "Payy Network is launching on Ethereum as a new payments network built on the chain.",
  w2ps82jvbciqt6cybq9xtze9:
    "2026 could be an opportunity for a cleaner reset on token design and incentives.",
  ph8i9gjla8q71l6wofyld6ui:
    "Zero is presented as a decentralized multi-core world computer.",
  n43y7at3xo7biyhfhe8fq8mr:
    "Something big is about to happen.",
  jzyh0mv2mvn14vqce2dic5rh:
    "'America in the Intelligence Age' is a thesis on how the country should approach the AI era.",
  dhm5lvulexa7u3r6tt76oyw3:
    "Lighter EVM is an EVM-equivalent rollup designed to interoperate natively with the core Lighter platform.",
  z20asiv41wgorja7isc5uynw:
    "The Ethereum Foundation is entering a period of mild austerity to pursue an aggressive roadmap while preserving long-term financial resilience.",
};

function decodeHtmlEntities(input = ""): string {
  return input
    .replace(/&#(\d+);/g, (_, value: string) =>
      String.fromCodePoint(Number(value))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) =>
      String.fromCodePoint(parseInt(value, 16))
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function cleanText(input = ""): string {
  return decodeHtmlEntities(input)
    .replace(/https?:\/\/\S+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[:\-\s]+|[:\-\s]+$/g, "")
    .trim();
}

function extractMetaContent(html: string, key: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${escapedKey}["'][^>]+content=(["'])([\\s\\S]*?)\\1`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=(["'])([\\s\\S]*?)\\1[^>]+property=["']${escapedKey}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${escapedKey}["'][^>]+content=(["'])([\\s\\S]*?)\\1`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=(["'])([\\s\\S]*?)\\1[^>]+name=["']${escapedKey}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[2]) {
      return match[2];
    }
  }

  return "";
}

function extractFixupxText(html: string): string {
  const altMatch = html.match(
    /<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']*owoembed[^"']+)["']/i
  );

  if (!altMatch?.[1]) {
    return "";
  }

  try {
    const altUrl = new URL(altMatch[1]);
    return altUrl.searchParams.get("text") || "";
  } catch {
    return "";
  }
}

function trimDescription(text: string, max = 260): string {
  const normalized = cleanText(text);
  if (!normalized) {
    return "";
  }

  if (normalized.length <= max) {
    return normalized;
  }

  const sentences = normalized.match(/[^.!?]+[.!?]?/g) || [normalized];
  let value = "";

  for (const sentence of sentences) {
    const next = `${value} ${sentence}`.trim();
    if (next.length > max) {
      break;
    }
    value = next;
    if (value.length > max * 0.6) {
      break;
    }
  }

  if (value) {
    return value;
  }

  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function fallbackDescription(item: BackfillItem): string {
  return buildFallbackNewsDescription(item.title);
}

function isBadDerivedDescription(description: string): boolean {
  const normalized = cleanText(description);

  if (!normalized) {
    return true;
  }

  if (normalized === "Sorry, that post doesn't exist :(") {
    return true;
  }

  if (
    /^💬\s*[\d.]+[KMB]?\s*🔁\s*[\d.]+[KMB]?\s*❤️\s*[\d.]+[KMB]?\s*👁️\s*[\d.]+[KMB]?$/u.test(
      normalized
    )
  ) {
    return true;
  }

  if (normalized.endsWith("1.")) {
    return true;
  }

  return false;
}

async function fetchHtml(url: string): Promise<string> {
  try {
    const proc = Bun.spawnSync(["curl", "-sSL", "--max-time", "20", url], {
      stdout: "pipe",
      stderr: "pipe",
    });

    if (proc.exitCode !== 0) {
      return "";
    }

    return proc.stdout.toString();
  } catch {
    return "";
  }
}

async function deriveDescription(
  item: BackfillItem
): Promise<Proposal> {
  const manual = MANUAL_DESCRIPTIONS[item.id];
  if (manual) {
    return {
      ...item,
      description: manual,
      via: "manual",
    };
  }

  let raw = "";
  let via: Proposal["via"] = "fallback";

  if (isMevLetterItem(item.title, item.url)) {
    const html = await fetchHtml(item.url);
    const description = resolveMevLetterDescription({
      title: item.title,
      url: item.url,
      description: item.description,
      html,
    });

    if (description) {
      return {
        ...item,
        description,
        via: "site-metadata",
      };
    }
  } else if (/^https?:\/\/(x\.com|twitter\.com)\//i.test(item.url)) {
    try {
      const fixupUrl = new URL(item.url);
      fixupUrl.hostname = "fixupx.com";

      const html = await fetchHtml(fixupUrl.toString());
      raw =
        extractMetaContent(html, "og:description") ||
        extractMetaContent(html, "twitter:description") ||
        extractMetaContent(html, "description") ||
        extractFixupxText(html);
      via = raw ? "x-metadata" : "fallback";
    } catch {
      via = "fallback";
    }
  } else {
    const html = await fetchHtml(item.url);
    raw =
      extractMetaContent(html, "og:description") ||
      extractMetaContent(html, "twitter:description") ||
      extractMetaContent(html, "description");
    via = raw ? "site-metadata" : "fallback";
  }

  const description = trimDescription(raw);

  return {
    ...item,
    description:
      description && !isBadDerivedDescription(description)
        ? description
        : fallbackDescription(item),
    via:
      description && !isBadDerivedDescription(description) ? via : "fallback",
  };
}

function parseArgs(argv: string[]) {
  return {
    write: argv.includes("--write"),
  };
}

async function loadMissingItems(): Promise<BackfillItem[]> {
  const [curatedRows, announcementRows] = await Promise.all([
    db.select().from(curatedLinks),
    db.select().from(announcements),
  ]);

  const curatedItems: BackfillItem[] = curatedRows
    .filter(
      (row) =>
        !row.description ||
        (isMevLetterItem(row.title, row.url) &&
          isGenericMevLetterDescription(row.description))
    )
    .map((row) => ({
      id: row.id,
      table: "curated",
      title: row.title,
      url: row.url,
      description: row.description,
      source: row.source,
      company: null,
      category: row.category,
    }));

  const announcementItems: BackfillItem[] = announcementRows
    .filter((row) => !row.description)
    .map((row) => ({
      id: row.id,
      table: "announcement",
      title: row.title,
      url: row.url,
      description: row.description,
      source: null,
      company: row.company,
      category: row.category,
    }));

  return [...curatedItems, ...announcementItems];
}

async function applyUpdates(proposals: Proposal[]) {
  for (const proposal of proposals) {
    if (proposal.table === "curated") {
      await db
        .update(curatedLinks)
        .set({ description: proposal.description })
        .where(eq(curatedLinks.id, proposal.id));
      continue;
    }

    await db
      .update(announcements)
      .set({ description: proposal.description })
      .where(eq(announcements.id, proposal.id));
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const missingItems = await loadMissingItems();
  const proposals = await Promise.all(missingItems.map(deriveDescription));

  writeFileSync(DRY_RUN_OUTPUT_PATH, JSON.stringify(proposals, null, 2));

  if (args.write) {
    await applyUpdates(proposals);
  }

  const summary = {
    total: proposals.length,
    metadataBacked: proposals.filter((item) => item.via !== "fallback").length,
    fallback: proposals.filter((item) => item.via === "fallback").length,
    fallbackItems: proposals
      .filter((item) => item.via === "fallback")
      .map((item) => ({
        id: item.id,
        table: item.table,
        title: item.title,
        url: item.url,
      })),
    output: DRY_RUN_OUTPUT_PATH,
    wrote: args.write,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
