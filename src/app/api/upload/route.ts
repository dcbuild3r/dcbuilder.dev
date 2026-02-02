import { NextRequest } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createId } from "@paralleldrive/cuid2";
import { requireAuth } from "@/services/auth";

// Initialize R2 client
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

// Allowed MIME types and their extensions
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/upload - Upload an image to R2
export async function POST(request: NextRequest) {
  // Require admin auth
  const auth = await requireAuth(request, "admin:write");
  if (auth instanceof Response) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES[file.type]) {
      return Response.json(
        { error: `Invalid file type. Allowed: ${Object.keys(ALLOWED_TYPES).join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = ALLOWED_TYPES[file.type];
    const filename = `${createId()}.${ext}`;
    const key = `${folder}/${filename}`;

    // Read file as buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2 with cache headers (1 year for immutable assets)
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    // Return public URL
    const url = `${PUBLIC_URL}/${key}`;

    return Response.json({
      success: true,
      url,
      key,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
