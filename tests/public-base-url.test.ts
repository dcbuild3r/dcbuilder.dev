import { afterEach, describe, expect, test } from "bun:test";
import { getBaseUrl } from "@/lib/data";

const originalPublicBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const originalVercelUrl = process.env.VERCEL_URL;
const originalVercelEnvironment = process.env.VERCEL_ENV;

describe("getBaseUrl", () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = originalPublicBaseUrl;
    process.env.VERCEL_URL = originalVercelUrl;
    process.env.VERCEL_ENV = originalVercelEnvironment;
  });

  test("uses the stable public origin for production deployments", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_URL = "dcbuilder-random-deployment.vercel.app";

    expect(getBaseUrl()).toBe("https://dcbuilder.dev");
  });

  test("keeps deployment-specific origins for preview deployments", () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "dcbuilder-preview.vercel.app";

    expect(getBaseUrl()).toBe("https://dcbuilder-preview.vercel.app");
  });
});
