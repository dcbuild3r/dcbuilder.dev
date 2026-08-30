import { describe, expect, test } from "bun:test";
import nextConfig from "../next.config";

describe("next image config", () => {
  test("allows the news grid image quality", () => {
    const imageConfig = nextConfig.images;

    expect(imageConfig).toBeDefined();
    expect(Array.isArray(imageConfig?.qualities)).toBe(true);
    expect(imageConfig?.qualities).toContain(90);
  });

  test("allows curated link source images from Substack CDN", () => {
    const imageConfig = nextConfig.images;

    expect(imageConfig).toBeDefined();
    expect(Array.isArray(imageConfig?.remotePatterns)).toBe(true);
    expect(imageConfig?.remotePatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocol: "https",
          hostname: "substackcdn.com",
        }),
      ]),
    );
  });
});

describe("production response hardening", () => {
  test("disables the framework signature and applies baseline security headers", async () => {
    expect(nextConfig.poweredByHeader).toBe(false);

    const rules = await nextConfig.headers?.();
    const globalRule = rules?.find((rule) => rule.source === "/:path*");
    const headerNames = globalRule?.headers.map((header) => header.key);

    expect(headerNames).toEqual(
      expect.arrayContaining([
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Referrer-Policy",
        "Permissions-Policy",
      ]),
    );
  });
});
