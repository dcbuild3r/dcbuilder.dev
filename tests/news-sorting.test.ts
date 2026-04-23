import { describe, expect, test } from "bun:test";
import { compareNewsByDateAndRelevance } from "../src/lib/news-sorting";

describe("compareNewsByDateAndRelevance", () => {
  test("sorts newer days first, then same-day items by relevance", () => {
    const items = [
      { id: "older-high", date: "2026-04-22T23:00:00.000Z", relevance: 10 },
      { id: "newer-low", date: "2026-04-23T00:00:00.000Z", relevance: 1 },
      { id: "same-day-low-late", date: "2026-04-22T23:30:00.000Z", relevance: 2 },
      { id: "same-day-high-early", date: "2026-04-22T01:00:00.000Z", relevance: 9 },
    ];

    expect(items.sort(compareNewsByDateAndRelevance).map((item) => item.id)).toEqual([
      "newer-low",
      "older-high",
      "same-day-high-early",
      "same-day-low-late",
    ]);
  });

  test("keeps same-day relevance descending when date sort is ascending", () => {
    const items = [
      { id: "newer", date: "2026-04-23", relevance: 1 },
      { id: "older-low", date: "2026-04-22", relevance: 2 },
      { id: "older-high", date: "2026-04-22", relevance: 8 },
    ];

    expect(
      items.sort((a, b) => compareNewsByDateAndRelevance(a, b, "asc")).map((item) => item.id)
    ).toEqual(["older-high", "older-low", "newer"]);
  });
});
