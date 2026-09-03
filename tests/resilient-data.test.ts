import { describe, expect, test } from "bun:test";
import { withDataFallback } from "../src/lib/resilient-data";

describe("withDataFallback", () => {
  test("returns data when the source succeeds", async () => {
    await expect(withDataFallback("test", Promise.resolve(["ok"]), [])).resolves.toEqual([
      "ok",
    ]);
  });

  test("returns a safe fallback when the source fails", async () => {
    const originalError = console.error;
    console.error = () => {};

    try {
      await expect(
        withDataFallback("test", Promise.reject(new Error("unavailable")), [])
      ).resolves.toEqual([]);
    } finally {
      console.error = originalError;
    }
  });

  test("returns a safe fallback when the source never settles", async () => {
    const originalError = console.error;
    console.error = () => {};

    try {
      const startedAt = Date.now();
      await expect(
        withDataFallback("test", new Promise<string[]>(() => {}), [], {
          timeoutMs: 20,
        })
      ).resolves.toEqual([]);
      expect(Date.now() - startedAt).toBeLessThan(100);
    } finally {
      console.error = originalError;
    }
  });
});
