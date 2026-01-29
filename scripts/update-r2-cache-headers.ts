/**
 * Update cache headers on existing R2 images
 * Run with: bunx dotenv-cli -e .env.local -- bun run scripts/update-r2-cache-headers.ts
 */

import { S3Client, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";

const R2_ENDPOINT = process.env.R2_ENDPOINT?.replace(/\/dcbuilder-images$/, "") || "";
const BUCKET = process.env.R2_BUCKET_NAME || "dcbuilder-images";

const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function getContentType(key: string): string {
  const ext = "." + (key.split(".").pop()?.toLowerCase() || "");
  return MIME_TYPES[ext] || "application/octet-stream";
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log("Updating cache headers on R2 images...");
  console.log("Bucket:", BUCKET);

  let continuationToken: string | undefined;
  let totalUpdated = 0;
  let batchNum = 0;

  do {
    batchNum++;
    console.log(`\nBatch ${batchNum}...`);

    const listResponse = await r2.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        ContinuationToken: continuationToken,
        MaxKeys: 20, // Smaller batches
      })
    );

    const objects = listResponse.Contents || [];
    console.log(`Found ${objects.length} objects`);

    for (const obj of objects) {
      const key = obj.Key;
      if (key === undefined) continue;

      try {
        await r2.send(
          new CopyObjectCommand({
            Bucket: BUCKET,
            CopySource: encodeURIComponent(`${BUCKET}/${key}`),
            Key: key,
            ContentType: getContentType(key),
            CacheControl: "public, max-age=31536000, immutable",
            MetadataDirective: "REPLACE",
          })
        );
        totalUpdated++;
        console.log(`  ${totalUpdated}. ${key}`);
      } catch (err) {
        console.error(`  Error updating ${key}:`, err);
      }

      // Small delay to avoid rate limiting
      await sleep(50);
    }

    continuationToken = listResponse.NextContinuationToken;

    // Longer delay between batches
    if (continuationToken) {
      console.log("Waiting before next batch...");
      await sleep(500);
    }
  } while (continuationToken);

  console.log(`\nDone! Updated ${totalUpdated} objects with cache headers.`);
}

main().catch(console.error);
