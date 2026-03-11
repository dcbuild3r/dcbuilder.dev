import { describe, expect, test } from "bun:test";

describe("portfolio page runtime mode", () => {
  test("forces runtime rendering instead of build-time prerendering", async () => {
    const pageModule = await import("../src/app/portfolio/page");
    const revalidate =
      "revalidate" in pageModule
        ? (pageModule as { revalidate?: number }).revalidate
        : undefined;

    expect(pageModule.dynamic).toBe("force-dynamic");
    expect(revalidate).toBeUndefined();
  });
});
