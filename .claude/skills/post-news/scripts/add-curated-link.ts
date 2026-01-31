#!/usr/bin/env bun
/**
 * Add a curated link to the database
 * Usage: bun scripts/add-curated-link.ts <json-data>
 *
 * JSON data should contain:
 * - title (required): Link title
 * - url (required): Link URL
 * - source (required): Source name (e.g., "Vitalik Buterin", "Paradigm")
 * - date (required): Date string (YYYY-MM-DD)
 * - category (required): x_post | crypto | ai | infrastructure | defi | research | product | funding | general
 * - description (optional): Description text
 * - featured (optional): boolean
 */

import { db, curatedLinks } from "../../../src/db";

const jsonData = process.argv[2];

if (!jsonData) {
  console.error("Usage: bun add-curated-link.ts '<json-data>'");
  process.exit(1);
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

  const result = await db.insert(curatedLinks).values({
    title: data.title,
    url: data.url,
    source: data.source,
    date: new Date(data.date),
    description: data.description,
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
