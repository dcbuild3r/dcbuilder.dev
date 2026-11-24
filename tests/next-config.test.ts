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

  test("does not let the CDN cache transient blog responses", async () => {
    const headerRules = await nextConfig.headers?.();
    const blogRule = headerRules?.find((rule) => rule.source === "/blog");

    expect(blogRule?.headers).toEqual(
      expect.arrayContaining([
        { key: "Cache-Control", value: "private, no-store" },
        { key: "Vercel-CDN-Cache-Control", value: "no-store" },
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

  test("does not cache homepage and news outage responses at the CDN", async () => {
    const rules = await nextConfig.headers?.();
    for (const source of ["/", "/news"]) {
      const rule = rules?.find((entry) => entry.source === source);
      expect(rule?.headers).toContainEqual({ key: "Vercel-CDN-Cache-Control", value: "no-store" });
    }
  });

  test("does not cache portfolio data failures", async () => {
    const rules = await nextConfig.headers?.();
    for (const source of ["/portfolio", "/portfolio/:path*"]) {
      const headers = new Map(rules?.find(rule => rule.source === source)?.headers.map(h => [h.key, h.value]));
      expect(headers.get("Cache-Control")).toBe("private, no-store");
      expect(headers.get("Vercel-CDN-Cache-Control")).toBe("no-store");
    }
  });

  test("does not cache transient jobs page failures as valid empty boards", async () => {
    const rules = await nextConfig.headers?.();
    const jobsRule = rules?.find((rule) => rule.source === "/jobs/:path*");
    const headers = new Map(
      jobsRule?.headers.map((header) => [header.key, header.value]),
    );

    expect(headers.get("Cache-Control")).toBe("private, no-store");
    expect(headers.get("Vercel-CDN-Cache-Control")).toBe("no-store");
  });
});
