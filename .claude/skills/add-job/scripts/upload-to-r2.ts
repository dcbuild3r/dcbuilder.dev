/**
 * R2 Upload Helper Script
 *
 * Usage:
 *   bun .claude/skills/add-job/scripts/upload-to-r2.ts <local-path> <r2-prefix>
 *
 * Examples:
 *   bun .claude/skills/add-job/scripts/upload-to-r2.ts /tmp/logo.png jobs/logos
 *   bun .claude/skills/add-job/scripts/upload-to-r2.ts ~/Documents/resume.pdf jobs/cvs
 *
 * Output:
 *   Prints the full R2 public URL on success
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createId } from '@paralleldrive/cuid2';
import { extname, resolve } from 'path';

const localPath = process.argv[2];
const r2Prefix = process.argv[3] || 'jobs';

if (!localPath) {
  console.error('Usage: bun upload-to-r2.ts <local-path> [r2-prefix]');
  console.error('Example: bun upload-to-r2.ts /tmp/logo.png jobs/logos');
  process.exit(1);
}

// Resolve the path (handles ~, relative paths, etc.)
const resolvedPath = localPath.startsWith('~')
  ? localPath.replace('~', process.env.HOME || '')
  : resolve(localPath);

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT?.replace(/\/dcbuilder-images$/, ''),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const file = Bun.file(resolvedPath);

if (!await file.exists()) {
  console.error(`File not found: ${resolvedPath}`);
  process.exit(1);
}

const buffer = await file.arrayBuffer();
const ext = extname(resolvedPath).slice(1).toLowerCase() || 'bin';
const key = `${r2Prefix}/${createId()}.${ext}`;

// Determine content type
const contentTypeMap: Record<string, string> = {
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'pdf': 'application/pdf',
  'ico': 'image/x-icon',
};
const contentType = contentTypeMap[ext] || file.type || 'application/octet-stream';

await r2.send(new PutObjectCommand({
  Bucket: 'dcbuilder-images',
  Key: key,
  Body: Buffer.from(buffer),
  ContentType: contentType,
  CacheControl: 'public, max-age=31536000, immutable',
}));

const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
console.log(publicUrl);
