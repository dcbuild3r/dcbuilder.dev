import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { R2_PUBLIC_URL } from "@/services/r2";

const BUCKET = process.env.R2_BUCKET_NAME || "dcbuilder-images";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

function r2Client() {
  const endpoint = process.env.R2_ENDPOINT?.replace(/\/dcbuilder-images$/, "");
  if (!endpoint || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 env vars missing (R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)");
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

/** Return true if the URL is already hosted on our R2 bucket. */
export function isOnR2(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("pub-a22f31a467534add843b6cf22cf4f443.r2.dev");
}

/** Return true if the URL is a local /images/ path (treated as managed). */
export function isLocalImages(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("/images/");
}

/** A URL is "managed" if it lives on R2 or in the local /images tree. */
export function isManagedImage(url: string | null | undefined): boolean {
  return isOnR2(url) || isLocalImages(url);
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/**
 * Pick a stable R2 key for a news image. Stable means: same logical source
 * (X handle, company) → same key, so we dedupe across rows and don't re-upload
 * the same avatar 50 times.
 */
export function pickAvatarKey(opts: {
  postUrl?: string | null;
  sourceImage?: string | null;
  ext: string;
}): string {
  const { postUrl, sourceImage, ext } = opts;

  const xMatch = postUrl?.match(/^https?:\/\/(?:x\.com|twitter\.com|mobile\.x\.com)\/([A-Za-z0-9_]{1,15})\//i);
  if (xMatch) return `news/avatars/twitter/${xMatch[1].toLowerCase()}${ext}`;

  const unavatarMatch = sourceImage?.match(/unavatar\.io\/(?:twitter\/)?([A-Za-z0-9_]{1,15})/i);
  if (unavatarMatch) return `news/avatars/twitter/${unavatarMatch[1].toLowerCase()}${ext}`;

  // Fallback: hash the source image URL so re-runs are idempotent.
  const h = createHash("sha1").update(sourceImage || postUrl || "").digest("hex").slice(0, 16);
  return `news/avatars/external/${h}${ext}`;
}

export function pickLogoKey(company: string, ext: string): string {
  return `news/logos/${slug(company)}${ext}`;
}

/** Sniff the file extension from a URL or Content-Type. */
function extFor(url: string, contentType?: string | null): string {
  const fromUrl = url.match(/\.(jpg|jpeg|png|gif|webp|svg)(?:\?|$)/i)?.[1];
  if (fromUrl) return `.${fromUrl.toLowerCase()}`.replace(".jpeg", ".jpg");
  if (contentType && EXT_BY_MIME[contentType]) return EXT_BY_MIME[contentType];
  return ".jpg";
}

async function objectExists(client: S3Client, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") return false;
    throw err;
  }
}

export interface RehostResult {
  url: string;
  key: string;
  skipped: boolean; // true = already on R2 or already managed
  reason?: string;
}

/**
 * Download `sourceUrl`, upload to R2 under a stable key, return the R2 public URL.
 * If the image is already on R2 (or in /images/), returns the input untouched.
 * Idempotent: if the target key already exists in R2, skips the upload.
 */
export async function rehostToR2(opts: {
  sourceUrl: string;
  key: string;
  client?: S3Client;
}): Promise<RehostResult> {
  const { sourceUrl, key } = opts;

  if (isManagedImage(sourceUrl)) {
    return { url: sourceUrl, key, skipped: true, reason: "already-managed" };
  }

  const client = opts.client ?? r2Client();
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

  if (await objectExists(client, key)) {
    return { url: publicUrl, key, skipped: true, reason: "key-exists" };
  }

  const resp = await fetch(sourceUrl, {
    redirect: "follow",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });
  if (!resp.ok) throw new Error(`fetch ${sourceUrl} → ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const contentType = resp.headers.get("content-type") || MIME_BY_EXT[key.match(/\.[a-z]+$/)?.[0] || ""] || "image/jpeg";

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buf,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return { url: publicUrl, key, skipped: false };
}

/** Convenience: rehost an avatar for a curated link given its post URL + source image URL. */
export async function rehostAvatar(opts: {
  postUrl?: string | null;
  sourceImage: string;
  client?: S3Client;
}): Promise<RehostResult> {
  const ext = extFor(opts.sourceImage);
  const key = pickAvatarKey({ postUrl: opts.postUrl, sourceImage: opts.sourceImage, ext });
  try {
    return await rehostToR2({ sourceUrl: opts.sourceImage, key, client: opts.client });
  } catch (err) {
    // Twitter rotates profile_images CDN keys; old pbs.twimg.com URLs return 404
    // after a user changes their avatar. Fall back to unavatar.io to grab the
    // current one, keyed under the same X handle for stable dedup.
    const handle = opts.postUrl?.match(/^https?:\/\/(?:x\.com|twitter\.com|mobile\.x\.com)\/([A-Za-z0-9_]{1,15})\//i)?.[1];
    const is404 = (err as Error).message.includes(" → 404");
    if (handle && is404) {
      const fallbackUrl = `https://unavatar.io/twitter/${handle.toLowerCase()}`;
      const fallbackKey = `news/avatars/twitter/${handle.toLowerCase()}.jpg`;
      return rehostToR2({ sourceUrl: fallbackUrl, key: fallbackKey, client: opts.client });
    }
    throw err;
  }
}

/** Convenience: rehost a company logo. */
export async function rehostCompanyLogo(opts: {
  company: string;
  sourceLogo: string;
  client?: S3Client;
}): Promise<RehostResult> {
  const ext = extFor(opts.sourceLogo);
  const key = pickLogoKey(opts.company, ext);
  return rehostToR2({ sourceUrl: opts.sourceLogo, key, client: opts.client });
}

export { r2Client };
