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
});
