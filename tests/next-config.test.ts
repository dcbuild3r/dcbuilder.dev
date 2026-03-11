import { describe, expect, test } from "bun:test";
import nextConfig from "../next.config";

describe("next image config", () => {
  test("allows the news grid image quality", () => {
    const imageConfig = nextConfig.images;

    expect(imageConfig).toBeDefined();
    expect(Array.isArray(imageConfig?.qualities)).toBe(true);
    expect(imageConfig?.qualities).toContain(90);
  });
});
