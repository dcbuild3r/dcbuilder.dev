#!/usr/bin/env bun
/**
 * Upload an image to Cloudflare R2
 * Usage: bun scripts/upload-to-r2.ts <file-path> [folder]
 *
 * Requires environment variables:
 * - R2_ENDPOINT
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME (default: dcbuilder-images)
 * - R2_PUBLIC_URL
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createId } from "@paralleldrive/cuid2";
import { extname } from "path";

const filePath = process.argv[2];
const folder = process.argv[3] || "news";

if (!filePath) {
  console.error("Usage: bun upload-to-r2.ts <file-path> [folder]");
  process.exit(1);
}

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT?.replace(/\/dcbuilder-images$/, ""),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "dcbuilder-images";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

try {
  const file = Bun.file(filePath);
  const buffer = await file.arrayBuffer();

  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const filename = `${createId()}${ext}`;
  const key = `${folder}/${filename}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const url = `${PUBLIC_URL}/${key}`;

  console.log(JSON.stringify({
    success: true,
    url,
    key,
    filename,
    size: buffer.byteLength,
    contentType,
  }));
} catch (error) {
  console.error(JSON.stringify({
    success: false,
    error: error instanceof Error ? error.message : String(error),
  }));
  process.exit(1);
}
