import { afterEach, describe, expect, mock, test } from "bun:test";
import { createPosthogModuleMock } from "./helpers/posthog-module-mock";

describe("GET /api/hot-news", () => {
  afterEach(() => {
    mock.restore();
  });

  test("returns hot news ids alongside click counts", async () => {
    const getNewsClicksLast7Days = mock(async () => ({
      success: true as const,
      data: [
        { id: "news-1", count: 14 },
        { id: "news-2", count: 3 },
      ],
    }));
    const determineHotNews = mock(() => ["news-1"]);

    mock.module("@/services/posthog", () =>
      createPosthogModuleMock({
        getNewsClicksLast7Days,
        determineHotNews,
      })
    );

    const { GET } = await import("../src/app/api/hot-news/route");
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.hotNewsIds).toEqual(["news-1"]);
    expect(payload.clickCounts).toEqual({
      "news-1": 14,
      "news-2": 3,
    });
    expect(typeof payload.updatedAt).toBe("string");
    expect(getNewsClicksLast7Days).toHaveBeenCalledTimes(1);
    expect(determineHotNews).toHaveBeenCalledWith(
      [
        { id: "news-1", count: 14 },
        { id: "news-2", count: 3 },
      ],
      5,
    );
  });
});
