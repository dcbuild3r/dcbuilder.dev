/**
 * Insert a curated link into the news feed.
 *
 * Usage:
 *   bunx dotenv -e .env.local -- bun run scripts/add-curated-link.ts \
 *     --title "..." --url "..." --source "..." --category x_post --date 2026-02-10
 *
 * If --date is omitted and the URL is an X status URL, the date is derived from the
 * tweet snowflake ID (UTC) and then truncated to YYYY-MM-DD.
 */

import { db } from "../src/db";
import { curatedLinks } from "../src/db/schema";
import {
  resolveMevLetterDescription,
  shouldRefreshMevLetterDescription,
} from "../src/lib/news-description-style";

type Args = {
  title?: string;
  url?: string;
  source?: string;
  sourceImage?: string;
  date?: string;
  description?: string;
  category?: string;
  featured?: boolean;
  dryRun?: boolean;
  help?: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {};

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      args.help = true;
      continue;
    }
    if (a === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (a === "--featured") {
      args.featured = true;
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith("--")) continue;

    if (a === "--title") {
      args.title = next;
      i++;
    } else if (a === "--url") {
      args.url = next;
      i++;
    } else if (a === "--source") {
      args.source = next;
      i++;
    } else if (a === "--source-image") {
      args.sourceImage = next;
      i++;
    } else if (a === "--date") {
      args.date = next;
      i++;
    } else if (a === "--description") {
      args.description = next;
      i++;
    } else if (a === "--category") {
      args.category = next;
      i++;
    }
  }

  return args;
}

function usage(): string {
  return [
    "scripts/add-curated-link.ts",
    "",
    "Required:",
    "  --title        Title/headline",
    "  --url          Full URL",
    "  --source       Author/publication (e.g. \"Trail of Bits\")",
    "",
    "Optional:",
    "  --category     Defaults to x_post for X URLs, otherwise general",
    "  --date         YYYY-MM-DD or ISO date; defaults to derived X status date or today",
    "  --description  Short description",
    "  --source-image Profile image URL",
    "  --featured     Mark as featured",
    "  --dry-run      Print payload without writing to the DB",
  ].join("\n");
}

function isXUrl(url: string): boolean {
  return /^https?:\/\/(x\.com|twitter\.com)\//i.test(url);
}

function dateFromXStatusUrl(url: string): string | null {
  const m = url.match(/\/status\/(\d+)/);
  if (!m) return null;
  try {
    // Twitter/X snowflake: (id >> 22) + 1288834974657 (ms since epoch)
    const id = BigInt(m[1]);
    const epoch = 1288834974657n;
    const tsMs = (id >> 22n) + epoch;
    const iso = new Date(Number(tsMs)).toISOString();
    return iso.split("T")[0];
  } catch {
    return null;
  }
}

async function fetchHtml(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return "";
    }

    return await response.text();
  } catch {
    return "";
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }

  if (!args.title || !args.url || !args.source) {
    console.error("Missing required args.\n\n" + usage());
    process.exit(2);
  }

  const category = args.category ?? (isXUrl(args.url) ? "x_post" : "general");
  const date =
    args.date ?? dateFromXStatusUrl(args.url) ?? new Date().toISOString().split("T")[0];
  const html = shouldRefreshMevLetterDescription(args.title, args.url, args.description)
    ? await fetchHtml(args.url)
    : "";
  const description = resolveMevLetterDescription({
    title: args.title,
    url: args.url,
    description: args.description,
    html,
  });

  const payload = {
    title: args.title,
    url: args.url,
    source: args.source,
    sourceImage: args.sourceImage,
    date: new Date(date),
    description,
    category,
    featured: args.featured ?? false,
  };

  if (args.dryRun) {
    console.log(JSON.stringify({ payload, dateIso: payload.date.toISOString() }, null, 2));
    process.exit(0);
  }

  const created = await db.insert(curatedLinks).values(payload).returning();
  console.log(JSON.stringify(created, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to add curated link:", err);
  process.exit(1);
});
