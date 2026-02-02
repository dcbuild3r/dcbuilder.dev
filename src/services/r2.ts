// Cloudflare R2 configuration
export const R2_PUBLIC_URL = "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev";

// Helper to convert local image path to R2 URL
export function toR2Url(path: string): string {
  // Already an R2 URL
  if (path.includes("r2.dev")) return path;

  // Already a full external URL
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  // Convert local path to R2 URL
  const cleanPath = path.replace(/^\/images\//, "").replace(/^images\//, "");
  return `${R2_PUBLIC_URL}/${cleanPath}`;
}
