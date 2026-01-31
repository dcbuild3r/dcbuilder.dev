#!/usr/bin/env bun
/**
 * Download an image from a URL and save it locally
 * Usage: bun scripts/download-image.ts <url> [output-path]
 */

const url = process.argv[2];
const outputPath = process.argv[3] || `/tmp/downloaded-${Date.now()}.jpg`;

if (!url) {
  console.error("Usage: bun download-image.ts <url> [output-path]");
  process.exit(1);
}

try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  await Bun.write(outputPath, buffer);

  console.log(JSON.stringify({
    success: true,
    path: outputPath,
    size: buffer.byteLength,
    contentType: response.headers.get("content-type"),
  }));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }));
  process.exit(1);
}
