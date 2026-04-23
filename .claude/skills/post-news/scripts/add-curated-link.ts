#!/usr/bin/env bun
/**
 * Add a curated link to the database
 * Usage: bun scripts/add-curated-link.ts <json-data>
 *
 * JSON data should contain:
 * - title (required): Link title
 * - url (required): Link URL
 * - source (required): Source name (e.g., "Vitalik Buterin", "Paradigm")
 * - sourceImage (optional): Source image URL (R2 or external)
 * - date (required): Date string (YYYY-MM-DD)
 * - category (required): x_post | crypto | ai | infrastructure | defi | research | product | funding | general
 * - description (optional): Description text
 * - featured (optional): boolean
 */

import { db, curatedLinks } from "../../../../src/db";
import {
  resolveMevLetterDescription,
  shouldRefreshMevLetterDescription,
} from "../../../../src/lib/news-description-style";

const jsonData = process.argv[2];

if (!jsonData) {
  console.error("Usage: bun add-curated-link.ts '<json-data>'");
  process.exit(1);
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

try {
  const data = JSON.parse(jsonData);

  // Validate required fields
  const required = ["title", "url", "source", "date", "category"];
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const html = shouldRefreshMevLetterDescription(data.title, data.url, data.description)
    ? await fetchHtml(data.url)
    : "";
  const description = resolveMevLetterDescription({
    title: data.title,
    url: data.url,
    description: data.description,
    html,
  });

  const result = await db.insert(curatedLinks).values({
    title: data.title,
    url: data.url,
    source: data.source,
    sourceImage: data.sourceImage,
    date: new Date(data.date),
    description,
    category: data.category,
    featured: data.featured || false,
  }).returning();

  console.log(JSON.stringify({ success: true, data: result[0] }, null, 2));
  process.exit(0);
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }));
  process.exit(1);
}
