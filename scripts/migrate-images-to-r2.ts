/**
 * Migrate all images from public/images/ to Cloudflare R2
 * and update database records with new URLs
 *
 * Run with: bunx dotenv-cli -e .env.local -- bun run scripts/migrate-images-to-r2.ts
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, like, or } from "drizzle-orm";
import * as schema from "../src/db/schema";
import * as fs from "fs";
import * as path from "path";

// R2 config
const R2_ENDPOINT = process.env.R2_ENDPOINT?.replace(/\/dcbuilder-images$/, "") || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "dcbuilder-images";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Database
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// MIME types
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const PUBLIC_IMAGES_DIR = path.join(process.cwd(), "public/images");

// Track uploaded files to avoid duplicates
const uploadedFiles = new Map<string, string>(); // local path -> R2 URL

async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadFile(localPath: string, r2Key: string): Promise<string> {
  // Check if already uploaded this session
  if (uploadedFiles.has(localPath)) {
    return uploadedFiles.get(localPath)!;
  }

  const ext = path.extname(localPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  // Check if already exists in R2
  const exists = await fileExistsInR2(r2Key);
  if (exists) {
    const url = `${R2_PUBLIC_URL}/${r2Key}`;
    console.log(`  [skip] Already exists: ${r2Key}`);
    uploadedFiles.set(localPath, url);
    return url;
  }

  // Read and upload
  const fileBuffer = fs.readFileSync(localPath);

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  const url = `${R2_PUBLIC_URL}/${r2Key}`;
  console.log(`  [upload] ${r2Key} (${(fileBuffer.length / 1024).toFixed(1)}KB)`);
  uploadedFiles.set(localPath, url);
  return url;
}

async function uploadAllImages(): Promise<Map<string, string>> {
  // Map: relative path (e.g., "/images/companies/foo.png") -> R2 URL
  const pathMapping = new Map<string, string>();

  console.log("\n=== Uploading images to R2 ===\n");

  const folders = ["", "candidates", "companies", "network", "investments"];

  for (const folder of folders) {
    const dirPath = folder ? path.join(PUBLIC_IMAGES_DIR, folder) : PUBLIC_IMAGES_DIR;

    if (!fs.existsSync(dirPath)) {
      continue;
    }

    const files = fs.readdirSync(dirPath);
    const imageFiles = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return MIME_TYPES[ext] !== undefined;
    });

    if (imageFiles.length === 0) continue;

    console.log(`\n${folder || "root"}/: ${imageFiles.length} images`);

    for (const file of imageFiles) {
      const localPath = path.join(dirPath, file);

      // Skip directories
      if (fs.statSync(localPath).isDirectory()) continue;

      // R2 key preserves folder structure
      const r2Key = folder ? `${folder}/${file}` : file;

      try {
        const url = await uploadFile(localPath, r2Key);

        // Map both /images/... and relative paths
        const relativePath = folder ? `/images/${folder}/${file}` : `/images/${file}`;
        pathMapping.set(relativePath, url);

        // Also map without leading slash
        pathMapping.set(relativePath.slice(1), url);
      } catch (error) {
        console.error(`  [error] Failed to upload ${file}:`, error);
      }
    }
  }

  return pathMapping;
}

function convertPathToR2Url(imagePath: string | null, pathMapping: Map<string, string>): string | null {
  if (!imagePath) return null;

  // Already an R2 URL
  if (imagePath.includes("r2.dev")) return imagePath;

  // Already a full external URL
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Try to find in mapping
  const url = pathMapping.get(imagePath) || pathMapping.get(imagePath.replace(/^\//, ""));

  if (url) return url;

  // Try constructing the URL directly
  const cleanPath = imagePath.replace(/^\/images\//, "").replace(/^images\//, "");
  return `${R2_PUBLIC_URL}/${cleanPath}`;
}

async function updateDatabase(pathMapping: Map<string, string>) {
  console.log("\n=== Updating database records ===\n");

  // Update jobs.companyLogo
  console.log("Updating jobs...");
  const allJobs = await db.select().from(schema.jobs);
  let jobsUpdated = 0;

  for (const job of allJobs) {
    if (job.companyLogo && !job.companyLogo.includes("r2.dev")) {
      const newUrl = convertPathToR2Url(job.companyLogo, pathMapping);
      if (newUrl && newUrl !== job.companyLogo) {
        await db.update(schema.jobs)
          .set({ companyLogo: newUrl, updatedAt: new Date() })
          .where(eq(schema.jobs.id, job.id));
        jobsUpdated++;
      }
    }
  }
  console.log(`  Updated ${jobsUpdated} jobs`);

  // Update candidates.image
  console.log("Updating candidates...");
  const allCandidates = await db.select().from(schema.candidates);
  let candidatesUpdated = 0;

  for (const candidate of allCandidates) {
    if (candidate.image && !candidate.image.includes("r2.dev")) {
      const newUrl = convertPathToR2Url(candidate.image, pathMapping);
      if (newUrl && newUrl !== candidate.image) {
        await db.update(schema.candidates)
          .set({ image: newUrl, updatedAt: new Date() })
          .where(eq(schema.candidates.id, candidate.id));
        candidatesUpdated++;
      }
    }
  }
  console.log(`  Updated ${candidatesUpdated} candidates`);

  // Update announcements.companyLogo
  console.log("Updating announcements...");
  const allAnnouncements = await db.select().from(schema.announcements);
  let announcementsUpdated = 0;

  for (const announcement of allAnnouncements) {
    if (announcement.companyLogo && !announcement.companyLogo.includes("r2.dev")) {
      const newUrl = convertPathToR2Url(announcement.companyLogo, pathMapping);
      if (newUrl && newUrl !== announcement.companyLogo) {
        await db.update(schema.announcements)
          .set({ companyLogo: newUrl, updatedAt: new Date() })
          .where(eq(schema.announcements.id, announcement.id));
        announcementsUpdated++;
      }
    }
  }
  console.log(`  Updated ${announcementsUpdated} announcements`);

  // Update investments.logo
  console.log("Updating investments...");
  const allInvestments = await db.select().from(schema.investments);
  let investmentsUpdated = 0;

  for (const investment of allInvestments) {
    if (investment.logo && !investment.logo.includes("r2.dev")) {
      const newUrl = convertPathToR2Url(investment.logo, pathMapping);
      if (newUrl && newUrl !== investment.logo) {
        await db.update(schema.investments)
          .set({ logo: newUrl, updatedAt: new Date() })
          .where(eq(schema.investments.id, investment.id));
        investmentsUpdated++;
      }
    }
  }
  console.log(`  Updated ${investmentsUpdated} investments`);

  // Update affiliations.logo
  console.log("Updating affiliations...");
  const allAffiliations = await db.select().from(schema.affiliations);
  let affiliationsUpdated = 0;

  for (const affiliation of allAffiliations) {
    if (affiliation.logo && !affiliation.logo.includes("r2.dev")) {
      const newUrl = convertPathToR2Url(affiliation.logo, pathMapping);
      if (newUrl && newUrl !== affiliation.logo) {
        await db.update(schema.affiliations)
          .set({ logo: newUrl, updatedAt: new Date() })
          .where(eq(schema.affiliations.id, affiliation.id));
        affiliationsUpdated++;
      }
    }
  }
  console.log(`  Updated ${affiliationsUpdated} affiliations`);

  console.log("\n=== Summary ===");
  console.log(`Jobs: ${jobsUpdated}`);
  console.log(`Candidates: ${candidatesUpdated}`);
  console.log(`Announcements: ${announcementsUpdated}`);
  console.log(`Investments: ${investmentsUpdated}`);
  console.log(`Affiliations: ${affiliationsUpdated}`);
  console.log(`Total: ${jobsUpdated + candidatesUpdated + announcementsUpdated + investmentsUpdated + affiliationsUpdated}`);
}

async function main() {
  console.log("R2 Migration Script");
  console.log("===================");
  console.log(`R2 Endpoint: ${R2_ENDPOINT}`);
  console.log(`R2 Bucket: ${R2_BUCKET_NAME}`);
  console.log(`R2 Public URL: ${R2_PUBLIC_URL}`);
  console.log(`Images Dir: ${PUBLIC_IMAGES_DIR}`);

  // Step 1: Upload all images
  const pathMapping = await uploadAllImages();

  console.log(`\nUploaded ${uploadedFiles.size} unique files`);

  // Step 2: Update database
  await updateDatabase(pathMapping);

  await client.end();
  console.log("\nMigration complete!");
}

main().catch(console.error);
