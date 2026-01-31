#!/usr/bin/env bun
/**
 * Add an announcement to the database
 * Usage: bun scripts/add-announcement.ts <json-data>
 *
 * JSON data should contain:
 * - title (required): Announcement title
 * - url (required): Link URL
 * - company (required): Company name
 * - platform (required): x | blog | discord | github | other
 * - date (required): Date string (YYYY-MM-DD)
 * - category (required): x_post | crypto | ai | infrastructure | defi | research | product | funding | general
 * - companyLogo (optional): Logo URL or local path
 * - description (optional): Description text
 * - featured (optional): boolean
 */

import { db, announcements } from "../../../src/db";

const jsonData = process.argv[2];

if (!jsonData) {
  console.error("Usage: bun add-announcement.ts '<json-data>'");
  process.exit(1);
}

try {
  const data = JSON.parse(jsonData);

  // Validate required fields
  const required = ["title", "url", "company", "platform", "date", "category"];
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const result = await db.insert(announcements).values({
    title: data.title,
    url: data.url,
    company: data.company,
    companyLogo: data.companyLogo,
    platform: data.platform,
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
